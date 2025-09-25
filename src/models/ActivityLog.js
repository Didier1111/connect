// src/models/ActivityLog.js
// Comprehensive activity logging for audit trails and analytics

const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Actor Information
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function() {
        return this.actorType === 'user';
      }
    },
    actorType: {
      type: String,
      enum: ['user', 'system', 'admin', 'api', 'bot', 'webhook'],
      required: true,
      default: 'user'
    },
    ip: {
      type: String,
      required: false
    },
    userAgent: {
      type: String,
      maxLength: [500, 'User agent cannot exceed 500 characters']
    },
    sessionId: {
      type: String,
      index: true
    }
  },

  // Action Details
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'user_login', 'user_logout', 'user_register', 'password_reset',
      'password_change', 'email_verify', 'two_factor_enable',
      'two_factor_disable', 'session_expire',

      // Profile actions
      'profile_update', 'avatar_change', 'skill_add', 'skill_remove',
      'preference_update', 'privacy_setting_change',

      // Task actions
      'task_create', 'task_update', 'task_delete', 'task_publish',
      'task_apply', 'task_assign', 'task_start', 'task_complete',
      'task_cancel', 'task_review', 'task_dispute', 'milestone_complete',

      // Payment actions
      'payment_initiate', 'payment_complete', 'payment_fail',
      'payment_refund', 'payout_request', 'invoice_generate',
      'contract_create', 'contract_sign', 'contract_terminate',

      // Communication actions
      'message_send', 'message_read', 'comment_post', 'review_submit',
      'rating_give', 'endorsement_give', 'follow_user', 'unfollow_user',

      // File actions
      'file_upload', 'file_download', 'file_delete', 'attachment_add',

      // Administrative actions
      'user_suspend', 'user_unsuspend', 'user_ban', 'user_verify',
      'content_moderate', 'report_handle', 'system_maintenance',

      // API actions
      'api_call', 'webhook_trigger', 'bulk_operation', 'data_export',
      'data_import', 'backup_create', 'backup_restore',

      // Security actions
      'suspicious_activity', 'rate_limit_exceed', 'unauthorized_access',
      'data_breach_attempt', 'malicious_request'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'authentication', 'profile', 'tasks', 'payments', 'communication',
      'files', 'administration', 'api', 'security', 'system'
    ]
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  },

  // Resource Information
  resource: {
    type: {
      type: String,
      enum: [
        'user', 'task', 'contract', 'payment', 'message', 'file',
        'notification', 'report', 'system', 'api_endpoint'
      ]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resource.type'
    },
    identifier: String, // Alternative identifier (slug, username, etc.)
    metadata: mongoose.Schema.Types.Mixed
  },

  // Context and Details
  context: {
    description: {
      type: String,
      required: true,
      maxLength: [500, 'Description cannot exceed 500 characters']
    },
    details: mongoose.Schema.Types.Mixed,
    tags: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    source: {
      type: String,
      enum: ['web', 'mobile', 'api', 'webhook', 'system', 'admin_panel'],
      default: 'web'
    },
    version: String // API version, app version, etc.
  },

  // Request Information
  request: {
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      uppercase: true
    },
    url: String,
    endpoint: String,
    params: mongoose.Schema.Types.Mixed,
    body: {
      type: mongoose.Schema.Types.Mixed,
      select: false // Sensitive data
    },
    headers: {
      type: mongoose.Schema.Types.Mixed,
      select: false // Potentially sensitive
    },
    query: mongoose.Schema.Types.Mixed
  },

  // Response Information
  response: {
    statusCode: Number,
    duration: Number, // milliseconds
    size: Number, // bytes
    error: {
      message: String,
      stack: String,
      code: String
    }
  },

  // Geolocation
  location: {
    country: String,
    region: String,
    city: String,
    latitude: Number,
    longitude: Number,
    timezone: String,
    isp: String
  },

  // Device Information
  device: {
    type: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'bot', 'unknown']
    },
    os: String,
    browser: String,
    version: String,
    mobile: {
      type: Boolean,
      default: false
    }
  },

  // Impact Assessment
  impact: {
    level: {
      type: String,
      enum: ['none', 'low', 'medium', 'high', 'critical'],
      default: 'none'
    },
    affected: [{
      type: {
        type: String,
        enum: ['user', 'task', 'payment', 'system']
      },
      count: Number,
      ids: [String]
    }],
    financial: {
      amount: Number,
      currency: String
    }
  },

  // Related Activities
  related: [{
    activityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ActivityLog'
    },
    relationship: {
      type: String,
      enum: ['caused_by', 'resulted_in', 'related_to', 'part_of']
    }
  }],

  // Flags and Status
  flags: {
    suspicious: {
      type: Boolean,
      default: false
    },
    automated: {
      type: Boolean,
      default: false
    },
    reviewed: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    }
  },

  // Review Information
  review: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'flagged', 'escalated']
    },
    actions: [{
      type: String,
      enum: ['none', 'warning', 'suspension', 'investigation', 'escalation']
    }]
  },

  // Retention
  retention: {
    category: {
      type: String,
      enum: ['standard', 'security', 'financial', 'legal', 'debug'],
      default: 'standard'
    },
    expiresAt: Date,
    archived: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  capped: { size: 1073741824, max: 10000000 } // 1GB cap, 10M documents max
});

// Indexes for performance optimization
activityLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ category: 1, createdAt: -1 });
activityLogSchema.index({ severity: 1, createdAt: -1 });
activityLogSchema.index({ 'resource.type': 1, 'resource.id': 1 });
activityLogSchema.index({ 'actor.ip': 1, createdAt: -1 });
activityLogSchema.index({ 'actor.sessionId': 1 });
activityLogSchema.index({ 'context.tags': 1 });
activityLogSchema.index({ 'flags.suspicious': 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ 'retention.expiresAt': 1 }, { expireAfterSeconds: 0 });

// Compound indexes for complex queries
activityLogSchema.index({
  'actor.userId': 1,
  action: 1,
  createdAt: -1
});

activityLogSchema.index({
  category: 1,
  severity: 1,
  'flags.suspicious': 1,
  createdAt: -1
});

// Text search index
activityLogSchema.index({
  'context.description': 'text',
  'context.tags': 'text'
});

// Pre-save middleware
activityLogSchema.pre('save', function(next) {
  // Set retention expiry if not provided
  if (!this.retention.expiresAt) {
    const retentionDays = {
      standard: 90,
      security: 365,
      financial: 2555, // 7 years
      legal: 2555, // 7 years
      debug: 30
    };

    const days = retentionDays[this.retention.category] || 90;
    this.retention.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  // Auto-flag suspicious activities
  const suspiciousActions = [
    'unauthorized_access', 'rate_limit_exceed', 'malicious_request',
    'data_breach_attempt', 'suspicious_activity'
  ];

  if (suspiciousActions.includes(this.action)) {
    this.flags.suspicious = true;
    this.severity = 'warning';
  }

  next();
});

// Instance methods
activityLogSchema.methods.flagAsSuspicious = function(reason) {
  this.flags.suspicious = true;
  this.review.status = 'pending';
  if (reason) {
    this.context.details = this.context.details || {};
    this.context.details.suspiciousReason = reason;
  }
  return this.save();
};

activityLogSchema.methods.markReviewed = function(reviewerId, status, notes) {
  this.flags.reviewed = true;
  this.review.reviewedBy = reviewerId;
  this.review.reviewedAt = new Date();
  this.review.status = status;
  if (notes) this.review.notes = notes;
  return this.save();
};

// Static methods
activityLogSchema.statics.logActivity = async function(activityData) {
  const activity = new this(activityData);

  // Enrich with additional context if available
  if (activityData.request && !activity.request.endpoint) {
    activity.request.endpoint = activityData.request.url;
  }

  return activity.save();
};

activityLogSchema.statics.getUserActivity = function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    category,
    action,
    startDate,
    endDate,
    severity
  } = options;

  const filter = { 'actor.userId': userId };

  if (category) filter.category = category;
  if (action) filter.action = action;
  if (severity) filter.severity = severity;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('resource.id')
    .lean();
};

activityLogSchema.statics.getSuspiciousActivity = function(options = {}) {
  const { limit = 100, skip = 0, severity } = options;

  const filter = { 'flags.suspicious': true };
  if (severity) filter.severity = severity;

  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('actor.userId', 'name email')
    .lean();
};

activityLogSchema.statics.getAnalytics = async function(timeframe = '24h') {
  const timeframes = {
    '1h': 1,
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
  };

  const hours = timeframes[timeframe] || 24;
  const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

  const pipeline = [
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          category: '$category',
          hour: { $hour: '$createdAt' }
        },
        count: { $sum: 1 },
        errors: {
          $sum: { $cond: [{ $eq: ['$severity', 'error'] }, 1, 0] }
        },
        suspicious: {
          $sum: { $cond: ['$flags.suspicious', 1, 0] }
        }
      }
    },
    { $sort: { '_id.hour': 1 } }
  ];

  return this.aggregate(pipeline);
};

activityLogSchema.statics.searchActivities = function(query, filters = {}) {
  const searchFilter = {
    $or: [
      { $text: { $search: query } },
      { 'context.description': new RegExp(query, 'i') },
      { action: new RegExp(query, 'i') }
    ]
  };

  return this.find({ ...searchFilter, ...filters })
    .sort({ createdAt: -1 })
    .populate('actor.userId', 'name email')
    .limit(100);
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);