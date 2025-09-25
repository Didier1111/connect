// src/models/Notification.js
// Comprehensive notification system for user engagement

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Basic Information
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Notification Content
  type: {
    type: String,
    required: true,
    enum: [
      // Task-related notifications
      'task_created', 'task_updated', 'task_assigned', 'task_completed',
      'task_cancelled', 'task_deadline_approaching', 'task_overdue',
      'application_received', 'application_accepted', 'application_rejected',
      'milestone_completed', 'task_reviewed',

      // Payment notifications
      'payment_received', 'payment_sent', 'payment_failed', 'payment_pending',
      'invoice_generated', 'payout_processed', 'refund_issued',

      // User interaction notifications
      'user_followed', 'user_unfollowed', 'profile_viewed',
      'message_received', 'review_received', 'endorsement_received',

      // System notifications
      'account_verified', 'security_alert', 'password_changed',
      'two_factor_enabled', 'login_unusual', 'data_export_ready',

      // Platform notifications
      'feature_announcement', 'maintenance_scheduled', 'policy_update',
      'newsletter', 'promotional', 'achievement_unlocked',
      'badge_earned', 'level_up', 'streak_milestone',

      // Community notifications
      'comment_on_task', 'mention_in_comment', 'forum_reply',
      'event_invitation', 'group_invitation', 'community_update'
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      'task_management', 'payments', 'social', 'security',
      'system', 'achievements', 'community', 'marketing'
    ]
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Content
  title: {
    type: String,
    required: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxLength: [1000, 'Message cannot exceed 1000 characters']
  },
  actionText: {
    type: String,
    maxLength: [50, 'Action text cannot exceed 50 characters']
  },
  actionUrl: {
    type: String,
    maxLength: [500, 'Action URL cannot exceed 500 characters']
  },

  // Rich Content
  data: {
    // Task-related data
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract'
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    },

    // Rich content
    imageUrl: String,
    thumbnailUrl: String,
    metadata: mongoose.Schema.Types.Mixed
  },

  // Delivery Channels
  channels: [{
    type: {
      type: String,
      enum: ['in_app', 'email', 'sms', 'push', 'webhook', 'slack', 'discord'],
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    sentAt: Date,
    deliveredAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed', 'bounced'],
      default: 'pending'
    },
    errorMessage: String,
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    }
  }],

  // Status and Tracking
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'dismissed', 'expired'],
    default: 'pending'
  },
  readAt: Date,
  dismissedAt: Date,
  expiresAt: Date,

  // Batch and Campaign
  batchId: {
    type: String,
    index: true
  },
  campaignId: {
    type: String,
    index: true
  },
  templateId: {
    type: String,
    index: true
  },

  // Personalization
  personalized: {
    type: Boolean,
    default: false
  },
  variables: mongoose.Schema.Types.Mixed,

  // Analytics
  analytics: {
    viewCount: {
      type: Number,
      default: 0
    },
    clickCount: {
      type: Number,
      default: 0
    },
    firstViewAt: Date,
    lastViewAt: Date,
    actionTaken: {
      type: Boolean,
      default: false
    },
    actionTakenAt: Date
  },

  // Scheduling
  scheduledFor: Date,
  timezone: {
    type: String,
    default: 'UTC'
  },

  // Settings
  settings: {
    persistent: {
      type: Boolean,
      default: false
    },
    grouped: {
      type: Boolean,
      default: true
    },
    sound: {
      type: String,
      enum: ['none', 'default', 'custom'],
      default: 'default'
    },
    vibration: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, status: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ batchId: 1 });
notificationSchema.index({ campaignId: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual fields
notificationSchema.virtual('isRead').get(function() {
  return this.status === 'read';
});

notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  if (this.status !== 'read') {
    this.status = 'read';
    this.readAt = new Date();
    this.analytics.viewCount += 1;

    if (!this.analytics.firstViewAt) {
      this.analytics.firstViewAt = this.readAt;
    }
    this.analytics.lastViewAt = this.readAt;
  }
  return this.save();
};

notificationSchema.methods.markAsDismissed = function() {
  this.status = 'dismissed';
  this.dismissedAt = new Date();
  return this.save();
};

notificationSchema.methods.recordClick = function() {
  this.analytics.clickCount += 1;
  this.analytics.actionTaken = true;
  this.analytics.actionTakenAt = new Date();
  return this.save();
};

// Static methods
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    status: { $in: ['sent', 'delivered'] }
  });
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      status: { $in: ['sent', 'delivered'] }
    },
    {
      $set: {
        status: 'read',
        readAt: new Date()
      },
      $inc: {
        'analytics.viewCount': 1
      }
    }
  );
};

notificationSchema.statics.getRecentNotifications = function(userId, limit = 20) {
  return this.find({
    recipient: userId,
    status: { $ne: 'dismissed' }
  })
  .populate('sender', 'name profile.avatar')
  .populate('data.taskId', 'title')
  .sort({ createdAt: -1 })
  .limit(limit);
};

notificationSchema.statics.createNotification = async function(notificationData) {
  const notification = new this(notificationData);

  // Set expiration if not provided
  if (!notification.expiresAt) {
    const expiryDays = notification.settings.persistent ? 30 : 7;
    notification.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  }

  // Add default channel if none specified
  if (!notification.channels || notification.channels.length === 0) {
    notification.channels = [{ type: 'in_app' }];
  }

  return notification.save();
};

module.exports = mongoose.model('Notification', notificationSchema);