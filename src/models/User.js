// src/models/User.js
// Enhanced User model with analytics and security features

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    trim: true,
    minLength: [3, 'Username must be at least 3 characters'],
    maxLength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },

  // Profile Information
  profile: {
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxLength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    location: {
      type: String,
      maxLength: [100, 'Location cannot exceed 100 characters'],
      default: ''
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
      default: ''
    },
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
      discord: { type: String, default: '' }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'ru']
    }
  },

  // Role and Permissions
  role: {
    type: String,
    enum: {
      values: ['contributor', 'agent', 'admin', 'moderator', 'verified_contributor'],
      message: '{VALUE} is not a valid role'
    },
    default: 'contributor'
  },
  permissions: [{
    type: String,
    enum: ['create_tasks', 'manage_agents', 'moderate_content', 'view_analytics', 'manage_payments']
  }],

  // Verification and Security
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },

  // Two-Factor Authentication
  twoFactorAuth: {
    enabled: {
      type: Boolean,
      default: false
    },
    secret: {
      type: String,
      select: false
    },
    backupCodes: [{
      type: String,
      select: false
    }]
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'deleted'],
    default: 'active'
  },
  suspensionReason: {
    type: String,
    default: null
  },
  suspensionExpires: {
    type: Date,
    default: null
  },

  // Skills and Expertise (for agents/contributors)
  skills: [{
    name: {
      type: String,
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    yearsExperience: {
      type: Number,
      min: 0,
      max: 50
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],

  // Professional Information
  professional: {
    hourlyRate: {
      type: Number,
      min: 0,
      max: 10000
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY']
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'away', 'offline'],
      default: 'available'
    },
    workingHours: {
      timezone: String,
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String, // Format: "09:00"
        endTime: String    // Format: "17:00"
      }]
    }
  },

  // Reputation System
  reputation: {
    score: {
      type: Number,
      default: 0,
      min: -1000,
      max: 10000
    },
    level: {
      type: String,
      enum: ['newcomer', 'bronze', 'silver', 'gold', 'platinum', 'diamond'],
      default: 'newcomer'
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: {
        type: Date,
        default: Date.now
      },
      category: {
        type: String,
        enum: ['achievement', 'skill', 'contribution', 'special']
      }
    }]
  },

  // Statistics and Analytics
  stats: {
    tasksCreated: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalRatings: {
      type: Number,
      default: 0
    },
    responseTime: {
      average: {
        type: Number,
        default: 0 // in hours
      },
      lastCalculated: {
        type: Date,
        default: Date.now
      }
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Activity Tracking
  activity: {
    lastLogin: {
      type: Date,
      default: Date.now
    },
    lastActive: {
      type: Date,
      default: Date.now
    },
    loginCount: {
      type: Number,
      default: 0
    },
    ipAddresses: [{
      ip: String,
      firstSeen: {
        type: Date,
        default: Date.now
      },
      lastSeen: {
        type: Date,
        default: Date.now
      },
      country: String,
      city: String
    }],
    devices: [{
      userAgent: String,
      browser: String,
      os: String,
      device: String,
      firstSeen: {
        type: Date,
        default: Date.now
      },
      lastSeen: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Preferences and Settings
  preferences: {
    emailNotifications: {
      taskUpdates: { type: Boolean, default: true },
      paymentAlerts: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: true }
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'verified_only', 'private'],
        default: 'public'
      },
      showEmail: { type: Boolean, default: false },
      showLocation: { type: Boolean, default: true },
      showStats: { type: Boolean, default: true }
    },
    dashboard: {
      defaultView: {
        type: String,
        enum: ['tasks', 'analytics', 'earnings', 'overview'],
        default: 'overview'
      },
      compactMode: { type: Boolean, default: false }
    }
  },

  // Payment Information
  paymentMethods: [{
    type: {
      type: String,
      enum: ['paypal', 'stripe', 'bank_transfer', 'cryptocurrency'],
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      select: false // Sensitive data
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    verified: {
      type: Boolean,
      default: false
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Compliance and Legal
  agreements: {
    termsAccepted: {
      type: Boolean,
      required: true,
      default: false
    },
    termsAcceptedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    privacyPolicyAccepted: {
      type: Boolean,
      required: true,
      default: false
    },
    privacyPolicyAcceptedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    gdprConsent: {
      type: Boolean,
      default: false
    },
    marketingConsent: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.twoFactorAuth.secret;
      delete ret.twoFactorAuth.backupCodes;
      return ret;
    }
  }
});

// Indexes for performance optimization
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ 'skills.name': 1, 'professional.availability': 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ 'reputation.score': -1 });
userSchema.index({ 'stats.averageRating': -1, 'stats.tasksCompleted': -1 });
userSchema.index({ 'activity.lastActive': -1 });
userSchema.index({ createdAt: -1 });

// Compound indexes for complex queries
userSchema.index({
  'skills.name': 1,
  'professional.availability': 1,
  'stats.averageRating': -1,
  status: 1
});

// Text search index
userSchema.index({
  name: 'text',
  'profile.bio': 'text',
  'skills.name': 'text'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update reputation level
userSchema.pre('save', function(next) {
  const score = this.reputation.score;

  if (score < 10) this.reputation.level = 'newcomer';
  else if (score < 100) this.reputation.level = 'bronze';
  else if (score < 500) this.reputation.level = 'silver';
  else if (score < 1000) this.reputation.level = 'gold';
  else if (score < 5000) this.reputation.level = 'platinum';
  else this.reputation.level = 'diamond';

  next();
});

// Instance Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

userSchema.methods.setupTwoFactorAuth = function() {
  const secret = speakeasy.generateSecret({
    name: `Project Connect (${this.email})`,
    issuer: 'Project Connect'
  });

  this.twoFactorAuth.secret = secret.base32;
  return secret;
};

userSchema.methods.verifyTwoFactorToken = function(token) {
  return speakeasy.totp.verify({
    secret: this.twoFactorAuth.secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
};

userSchema.methods.updateActivity = function(ipAddress, userAgent) {
  this.activity.lastActive = new Date();

  // Update IP address tracking
  const existingIp = this.activity.ipAddresses.find(ip => ip.ip === ipAddress);
  if (existingIp) {
    existingIp.lastSeen = new Date();
  } else {
    this.activity.ipAddresses.push({
      ip: ipAddress,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
  }

  // Update device tracking
  if (userAgent) {
    const existingDevice = this.activity.devices.find(device => device.userAgent === userAgent);
    if (existingDevice) {
      existingDevice.lastSeen = new Date();
    } else {
      this.activity.devices.push({
        userAgent: userAgent,
        firstSeen: new Date(),
        lastSeen: new Date()
      });
    }
  }
};

userSchema.methods.updateStats = async function() {
  const Task = mongoose.model('Task');
  const Contract = mongoose.model('Contract');
  const Payment = mongoose.model('Payment');

  try {
    // Update task statistics
    const tasksCreated = await Task.countDocuments({ createdBy: this._id });
    const tasksCompleted = await Task.countDocuments({
      assignedTo: this._id,
      status: 'completed'
    });

    // Update earnings
    const completedContracts = await Contract.find({
      $or: [
        { contributorId: this._id },
        { agentId: this._id }
      ],
      status: 'completed'
    });

    let totalEarnings = 0;
    for (const contract of completedContracts) {
      const payments = await Payment.find({
        contractId: contract._id,
        status: 'completed'
      });
      totalEarnings += payments.reduce((sum, payment) => sum + payment.amount, 0);
    }

    // Update completion rate
    const totalAssignedTasks = await Task.countDocuments({ assignedTo: this._id });
    const completionRate = totalAssignedTasks > 0 ? (tasksCompleted / totalAssignedTasks) * 100 : 0;

    this.stats.tasksCreated = tasksCreated;
    this.stats.tasksCompleted = tasksCompleted;
    this.stats.totalEarnings = totalEarnings;
    this.stats.completionRate = Math.round(completionRate * 100) / 100;

    return this.save();
  } catch (error) {
    throw new Error('Failed to update user statistics');
  }
};

// Static Methods
userSchema.statics.findActiveAgents = function(filters = {}) {
  return this.find({
    role: { $in: ['agent', 'verified_contributor'] },
    status: 'active',
    'professional.availability': { $ne: 'offline' },
    ...filters
  }).select('name profile.avatar skills professional reputation stats');
};

userSchema.statics.getTopPerformers = function(limit = 10) {
  return this.find({
    status: 'active',
    'stats.tasksCompleted': { $gt: 0 }
  })
  .sort({
    'reputation.score': -1,
    'stats.averageRating': -1,
    'stats.tasksCompleted': -1
  })
  .limit(limit)
  .select('name profile.avatar reputation stats');
};

userSchema.statics.searchUsers = function(query, filters = {}) {
  return this.find({
    $and: [
      {
        $or: [
          { $text: { $search: query } },
          { name: new RegExp(query, 'i') },
          { username: new RegExp(query, 'i') }
        ]
      },
      filters
    ]
  }).select('name username profile.avatar skills reputation stats');
};

module.exports = mongoose.model('User', userSchema);