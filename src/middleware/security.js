// src/middleware/security.js
// Comprehensive Security Middleware for Project Connect
// Implements enterprise-grade security measures for financial platform

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const winston = require('winston');
const crypto = require('crypto');

// Security Logger Configuration
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'project-connect-security' },
  transports: [
    new winston.transports.File({ filename: 'logs/security-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security-audit.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Rate Limiting Configuration
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      securityLogger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl,
        method: req.method
      });
      res.status(429).json({ error: message });
    }
  });
};

// Authentication Rate Limiting (stricter)
const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again in 15 minutes'
);

// General API Rate Limiting
const apiRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests, please try again later'
);

// Payment Rate Limiting (very strict)
const paymentRateLimit = createRateLimit(
  60 * 60 * 1000, // 1 hour
  10, // 10 payment requests
  'Too many payment requests, please try again in 1 hour'
);

// Slow Down Middleware for Brute Force Protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 10, // allow 10 requests per 15 minutes at full speed
  delayMs: 500, // slow down by 500ms per request after delayAfter
  maxDelayMs: 20000, // maximum delay of 20 seconds
});

// Security Headers Configuration
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for development
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// CORS Configuration
const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests from specific origins in production
    const allowedOrigins = [
      'https://projectconnect.dev',
      'https://app.projectconnect.dev',
      'http://localhost:3000',
      'http://localhost:3001'
    ];

    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      securityLogger.warn('CORS violation', { origin, userAgent: origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // Cache preflight for 24 hours
});

// Request Sanitization
const sanitizeRequest = (req, res, next) => {
  // Remove any keys that contain '$' or '.'
  mongoSanitize()(req, res, () => {
    // Additional sanitization for specific fields
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    next();
  });
};

// Deep object sanitization
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      // Remove potentially dangerous keys
      if (key.includes('$') || key.includes('.') || key === '__proto__') {
        continue;
      }

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitized[key] = sanitizeObject(obj[key]);
      } else if (typeof obj[key] === 'string') {
        // Basic HTML sanitization
        sanitized[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
          .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};

// Security Audit Logging Middleware
const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log security-relevant events
    if (req.originalUrl.includes('/auth/') ||
        req.originalUrl.includes('/payments/') ||
        req.originalUrl.includes('/contracts/') ||
        res.statusCode >= 400) {

      securityLogger.info('API Request', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.userId || 'anonymous',
        statusCode: res.statusCode,
        duration: duration,
        requestId: req.headers['x-request-id'] || crypto.randomUUID()
      });
    }

    originalSend.call(this, data);
  };

  next();
};

// Request ID Generator
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// IP Validation Middleware
const validateIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  // Block known malicious IPs (implement your own blacklist)
  const blockedIPs = process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : [];

  if (blockedIPs.includes(clientIP)) {
    securityLogger.warn('Blocked IP access attempt', { ip: clientIP });
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
};

// Content Type Validation
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({ error: 'Invalid content type' });
    }
  }
  next();
};

// Error Handler with Security Considerations
const secureErrorHandler = (err, req, res, next) => {
  securityLogger.error('Application Error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous',
    requestId: req.requestId
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(err.status || 500).json({
      error: 'Internal server error',
      requestId: req.requestId
    });
  } else {
    res.status(err.status || 500).json({
      error: err.message,
      stack: err.stack,
      requestId: req.requestId
    });
  }
};

module.exports = {
  helmetConfig,
  corsConfig,
  authRateLimit,
  apiRateLimit,
  paymentRateLimit,
  speedLimiter,
  sanitizeRequest,
  auditLogger,
  requestId,
  validateIP,
  validateContentType,
  secureErrorHandler,
  securityLogger,
  hppProtection: hpp() // HTTP Parameter Pollution protection
};