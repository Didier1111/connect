// src/middleware/validation.js
// Comprehensive Input Validation for Project Connect
// Implements enterprise-grade input validation for financial platform

const Joi = require('joi');
const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Custom Joi extensions for enhanced validation
const customJoi = Joi.extend((joi) => ({
  type: 'objectId',
  base: joi.string(),
  messages: {
    'objectId.invalid': '"{{#label}}" must be a valid ObjectId'
  },
  validate(value, helpers) {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return { value, errors: helpers.error('objectId.invalid') };
    }
    return { value };
  }
}));

// Password validation schema
const passwordSchema = Joi.string()
  .min(12)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
  .required()
  .messages({
    'string.min': 'Password must be at least 12 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

// Email validation schema
const emailSchema = Joi.string()
  .email()
  .lowercase()
  .required()
  .messages({
    'string.email': 'Please provide a valid email address'
  });

// Validation schemas for different entities

// User validation schemas
const userRegistrationSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name can only contain letters and spaces'
    }),
  email: emailSchema,
  password: passwordSchema,
  role: Joi.string()
    .valid('contributor', 'agent', 'admin')
    .default('contributor')
});

const userLoginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
  twoFactorToken: Joi.string().length(6).pattern(/^[0-9]{6}$/).optional()
});

// Task validation schemas
const taskSchema = Joi.object({
  title: Joi.string()
    .min(10)
    .max(200)
    .required()
    .messages({
      'string.min': 'Task title must be at least 10 characters'
    }),
  description: Joi.string()
    .min(50)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Task description must be at least 50 characters'
    }),
  category: Joi.string()
    .valid('development', 'content', 'analysis', 'community', 'strategic')
    .required(),
  skillsRequired: Joi.array()
    .items(Joi.string().max(50))
    .min(1)
    .max(10)
    .required(),
  budget: Joi.object({
    amount: Joi.number().positive().precision(2).max(100000).required(),
    currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
    type: Joi.string().valid('fixed', 'hourly', 'milestone').required()
  }).required(),
  timeline: Joi.object({
    startDate: Joi.date().iso().min('now').required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required()
  }).required()
});

const taskUpdateSchema = taskSchema.fork(['title', 'description', 'category', 'skillsRequired', 'budget', 'timeline'], (schema) => schema.optional());

// Agent validation schemas
const agentSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s]+$/)
    .required(),
  email: emailSchema,
  skills: Joi.array()
    .items(Joi.string().max(50))
    .min(1)
    .max(20)
    .required(),
  hourlyRate: Joi.number().positive().precision(2).max(1000).required(),
  agentType: Joi.string()
    .valid('human', 'ai', 'hybrid')
    .required(),
  availability: Joi.string()
    .valid('available', 'busy', 'offline')
    .default('available')
});

// Contract validation schemas
const contractSchema = Joi.object({
  taskId: customJoi.objectId().required(),
  agentId: customJoi.objectId().required(),
  terms: Joi.object({
    paymentAmount: Joi.number().positive().precision(2).max(100000).required(),
    paymentType: Joi.string().valid('fixed', 'hourly', 'milestone').required(),
    milestones: Joi.when('paymentType', {
      is: 'milestone',
      then: Joi.array().items(Joi.object({
        description: Joi.string().min(10).max(500).required(),
        amount: Joi.number().positive().precision(2).required(),
        dueDate: Joi.date().iso().min('now').required()
      })).min(1).required(),
      otherwise: Joi.array().items(Joi.object({
        description: Joi.string().min(10).max(500).required(),
        amount: Joi.number().positive().precision(2).required(),
        dueDate: Joi.date().iso().min('now').required()
      })).optional()
    })
  }).required()
});

// Payment validation schemas
const paymentSchema = Joi.object({
  contractId: customJoi.objectId().required(),
  milestoneId: Joi.string().optional(),
  amount: Joi.number().positive().precision(2).max(100000).required(),
  currency: Joi.string().valid('USD', 'EUR', 'GBP').default('USD'),
  method: Joi.string()
    .valid('credit_card', 'paypal', 'bank_transfer', 'cryptocurrency')
    .required(),
  // Sensitive payment data should be handled by payment processor
  paymentToken: Joi.string().required() // Token from payment processor
});

// Query parameter validation schemas
const paginationSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0)
});

const taskQuerySchema = paginationSchema.keys({
  status: Joi.string().valid('pending', 'inProgress', 'completed', 'cancelled'),
  category: Joi.string().valid('development', 'content', 'analysis', 'community', 'strategic'),
  minBudget: Joi.number().positive(),
  maxBudget: Joi.number().positive()
});

const agentQuerySchema = paginationSchema.keys({
  skills: Joi.string(), // comma-separated skills
  rating: Joi.number().min(1).max(5),
  availability: Joi.string().valid('available', 'busy', 'offline'),
  agentType: Joi.string().valid('human', 'ai', 'hybrid')
});

// Validation middleware factory
const validate = (schema, location = 'body') => {
  return (req, res, next) => {
    const data = req[location];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    req[location] = value;
    next();
  };
};

// Express-validator based validation chains
const validationChains = {
  objectId: param('id').isMongoId().withMessage('Invalid ObjectId format'),

  userRegistration: [
    body('name')
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 12 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/)
      .withMessage('Password must be at least 12 characters with uppercase, lowercase, number, and special character'),
    body('role')
      .optional()
      .isIn(['contributor', 'agent', 'admin'])
      .withMessage('Invalid role')
  ],

  userLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
    body('twoFactorToken')
      .optional()
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('2FA token must be 6 digits')
  ]
};

// Check validation results
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: formattedErrors
    });
  }
  next();
};

// File upload validation
const validateFileUpload = (allowedTypes, maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.files || [req.file];

    for (const file of files) {
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
        });
      }

      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          error: `File size too large. Maximum size: ${maxSize / (1024 * 1024)}MB`
        });
      }

      // Validate file name (prevent path traversal)
      if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
        return res.status(400).json({
          error: 'Invalid file name'
        });
      }
    }

    next();
  };
};

module.exports = {
  // Joi validation schemas
  userRegistrationSchema,
  userLoginSchema,
  taskSchema,
  taskUpdateSchema,
  agentSchema,
  contractSchema,
  paymentSchema,
  taskQuerySchema,
  agentQuerySchema,
  paginationSchema,

  // Validation middleware
  validate,
  validationChains,
  checkValidation,
  validateFileUpload,

  // Custom validators
  customJoi
};