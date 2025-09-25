// src/middleware/authentication.js
// Advanced Authentication System for Project Connect
// Implements 2FA, JWT refresh tokens, OAuth, and secure session management

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { securityLogger } = require('./security');

// Enhanced JWT configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_2FA_SECRET = process.env.JWT_2FA_SECRET || crypto.randomBytes(64).toString('hex');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const TWO_FACTOR_TOKEN_EXPIRY = '10m';

// In-memory store for refresh tokens (use Redis in production)
const refreshTokens = new Map();

// Rate limiting for authentication attempts
const authAttempts = new Map();
const MAX_AUTH_ATTEMPTS = 5;
const AUTH_LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Password hashing with enhanced security
const hashPassword = async (password) => {
  const saltRounds = 14; // Higher cost for better security
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate secure JWT tokens
const generateTokens = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    permissions: getUserPermissions(user.role)
  };

  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'project-connect',
    audience: 'project-connect-api'
  });

  const refreshToken = jwt.sign(
    { userId: user._id, tokenVersion: user.tokenVersion || 1 },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'project-connect',
      audience: 'project-connect-api'
    }
  );

  // Store refresh token
  refreshTokens.set(refreshToken, {
    userId: user._id,
    createdAt: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
  });

  return { accessToken, refreshToken };
};

// Generate 2FA token
const generate2FAToken = (userId) => {
  return jwt.sign(
    { userId, purpose: '2fa' },
    JWT_2FA_SECRET,
    {
      expiresIn: TWO_FACTOR_TOKEN_EXPIRY,
      issuer: 'project-connect',
      audience: 'project-connect-2fa'
    }
  );
};

// User permissions based on role
const getUserPermissions = (role) => {
  const permissions = {
    admin: [
      'users:read', 'users:write', 'users:delete',
      'tasks:read', 'tasks:write', 'tasks:delete',
      'agents:read', 'agents:write', 'agents:delete',
      'contracts:read', 'contracts:write', 'contracts:delete',
      'payments:read', 'payments:write', 'payments:process',
      'system:admin'
    ],
    contributor: [
      'tasks:read', 'tasks:create', 'tasks:update_own',
      'agents:read',
      'contracts:read', 'contracts:create', 'contracts:update_own',
      'payments:read', 'payments:create'
    ],
    agent: [
      'tasks:read',
      'agents:read', 'agents:update_own',
      'contracts:read', 'contracts:update_assigned',
      'payments:read'
    ]
  };

  return permissions[role] || [];
};

// Enhanced authentication middleware
const authenticateToken = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        securityLogger.warn('Missing authentication token', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          endpoint: req.originalUrl
        });
        return res.status(401).json({ error: 'Access token required' });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET, {
        issuer: 'project-connect',
        audience: 'project-connect-api'
      });

      req.user = decoded;

      // Check if user has required permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = requiredPermissions.some(permission =>
          decoded.permissions.includes(permission)
        );

        if (!hasPermission) {
          securityLogger.warn('Insufficient permissions', {
            userId: decoded.userId,
            requiredPermissions,
            userPermissions: decoded.permissions,
            endpoint: req.originalUrl
          });
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
      }

      // Log successful authentication for audit
      securityLogger.info('Successful authentication', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        endpoint: req.originalUrl,
        ip: req.ip
      });

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        securityLogger.warn('Expired token used', {
          ip: req.ip,
          endpoint: req.originalUrl
        });
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }

      if (error.name === 'JsonWebTokenError') {
        securityLogger.warn('Invalid token used', {
          ip: req.ip,
          endpoint: req.originalUrl,
          error: error.message
        });
        return res.status(403).json({ error: 'Invalid token' });
      }

      securityLogger.error('Authentication error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        endpoint: req.originalUrl
      });

      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
};

// Rate limiting for authentication
const checkAuthAttempts = (identifier) => {
  const attempts = authAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
  const now = Date.now();

  // Reset attempts if lockout period has passed
  if (now - attempts.lastAttempt > AUTH_LOCKOUT_TIME) {
    attempts.count = 0;
  }

  if (attempts.count >= MAX_AUTH_ATTEMPTS) {
    const timeLeft = AUTH_LOCKOUT_TIME - (now - attempts.lastAttempt);
    if (timeLeft > 0) {
      return {
        blocked: true,
        timeLeft: Math.ceil(timeLeft / 1000 / 60) // minutes
      };
    }
  }

  return { blocked: false };
};

const recordAuthAttempt = (identifier, success = false) => {
  const attempts = authAttempts.get(identifier) || { count: 0, lastAttempt: 0 };

  if (success) {
    // Clear attempts on successful login
    authAttempts.delete(identifier);
  } else {
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    authAttempts.set(identifier, attempts);
  }
};

// Two-Factor Authentication setup
const setup2FA = async (userId, userEmail) => {
  const secret = speakeasy.generateSecret({
    name: `Project Connect (${userEmail})`,
    issuer: 'Project Connect',
    length: 32
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    manualEntryKey: secret.base32
  };
};

// Verify 2FA token
const verify2FA = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    token: token,
    window: 2, // Allow 2 time steps (60 seconds) of tolerance
    time: Math.floor(Date.now() / 1000)
  });
};

// Refresh token validation and generation
const refreshAccessToken = async (refreshToken) => {
  try {
    // Check if refresh token exists in store
    const tokenData = refreshTokens.get(refreshToken);
    if (!tokenData) {
      throw new Error('Invalid refresh token');
    }

    // Check if token has expired
    if (Date.now() > tokenData.expiresAt) {
      refreshTokens.delete(refreshToken);
      throw new Error('Refresh token expired');
    }

    // Verify JWT
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      issuer: 'project-connect',
      audience: 'project-connect-api'
    });

    // Here you would fetch the user from database to get current info
    // For now, we'll return the basic token structure
    return {
      userId: decoded.userId,
      tokenVersion: decoded.tokenVersion
    };

  } catch (error) {
    // Remove invalid token
    refreshTokens.delete(refreshToken);
    throw error;
  }
};

// Logout and token cleanup
const logout = (refreshToken) => {
  refreshTokens.delete(refreshToken);
};

// Admin middleware for sensitive operations
const requireAdmin = authenticateToken(['system:admin']);

// Resource owner middleware
const requireResourceOwner = (resourceField = 'createdBy') => {
  return (req, res, next) => {
    const userId = req.user.userId;
    const isAdmin = req.user.permissions.includes('system:admin');

    // Admins can access everything
    if (isAdmin) {
      return next();
    }

    // For new resources, the user becomes the owner
    if (req.method === 'POST') {
      req.body[resourceField] = userId;
      return next();
    }

    // For existing resources, check ownership (this would need database check)
    // This is a simplified version - you'd need to query the database
    req.checkOwnership = { field: resourceField, userId };
    next();
  };
};

// Secure session cleanup (for scheduled cleanup job)
const cleanupExpiredTokens = () => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [token, data] of refreshTokens.entries()) {
    if (now > data.expiresAt) {
      refreshTokens.delete(token);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    securityLogger.info('Cleaned up expired refresh tokens', { count: cleanedCount });
  }

  return cleanedCount;
};

// Password reset token generation
const generatePasswordResetToken = (userId) => {
  return jwt.sign(
    { userId, purpose: 'password-reset' },
    JWT_ACCESS_SECRET,
    {
      expiresIn: '1h',
      issuer: 'project-connect',
      audience: 'project-connect-reset'
    }
  );
};

module.exports = {
  hashPassword,
  comparePassword,
  generateTokens,
  generate2FAToken,
  authenticateToken,
  setup2FA,
  verify2FA,
  refreshAccessToken,
  logout,
  requireAdmin,
  requireResourceOwner,
  checkAuthAttempts,
  recordAuthAttempt,
  cleanupExpiredTokens,
  generatePasswordResetToken,
  getUserPermissions,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_2FA_SECRET
};