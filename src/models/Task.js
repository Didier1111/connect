// src/models/Task.js
// Enhanced Task model with analytics and advanced features

const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Task description is required'],
    trim: true,
    maxLength: [5000, 'Description cannot exceed 5000 characters']
  },
  shortDescription: {
    type: String,
    maxLength: [300, 'Short description cannot exceed 300 characters'],
    trim: true
  },

  // Categorization
  category: {
    type: String,
    required: [true, 'Task category is required'],
    enum: {
      values: [
        'development', 'design', 'content', 'marketing', 'analysis',
        'community', 'strategic', 'research', 'testing', 'documentation',
        'blockchain', 'ai_ml', 'mobile', 'web3', 'defi'
      ],
      message: '{VALUE} is not a valid category'
    }
  },
  subcategory: {
    type: String,
    enum: [
      // Development subcategories
      'frontend', 'backend', 'fullstack', 'mobile_app', 'desktop_app',
      'smart_contracts', 'api_development', 'database_design',
      // Design subcategories
      'ui_design', 'ux_design', 'graphic_design', 'logo_design',
      'web_design', 'mobile_design', 'brand_identity',
      // Content subcategories
      'copywriting', 'technical_writing', 'blog_writing', 'social_media',
      'video_content', 'podcast', 'translation',
      // Other subcategories
      'seo', 'market_research', 'data_analysis', 'project_management'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Skills and Requirements
  skillsRequired: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    priority: {
      type: String,
      enum: ['must-have', 'nice-to-have'],
      default: 'must-have'
    }
  }],
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'expert'],
    required: true
  },
  estimatedHours: {
    type: Number,
    min: [0.5, 'Minimum task duration is 0.5 hours'],
    max: [1000, 'Maximum task duration is 1000 hours']
  },

  // Budget and Payment
  budget: {
    amount: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [1, 'Budget must be at least $1']
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'BTC', 'ETH']
    },
    type: {
      type: String,
      required: true,
      enum: {
        values: ['fixed', 'hourly', 'milestone', 'revenue_share'],
        message: '{VALUE} is not a valid budget type'
      }
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    range: {
      min: Number,
      max: Number
    }
  },

  // Timeline
  timeline: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    estimatedDuration: {
      value: Number,
      unit: {
        type: String,
        enum: ['hours', 'days', 'weeks', 'months'],
        default: 'days'
      }
    },
    flexible: {
      type: Boolean,
      default: false
    }
  },

  // Status and Progress
  status: {
    type: String,
    enum: {
      values: [
        'draft', 'pending', 'open', 'in_progress', 'under_review',
        'completed', 'cancelled', 'expired', 'disputed'
      ],
      message: '{VALUE} is not a valid status'
    },
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  progress: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    milestones: [{
      title: {
        type: String,
        required: true
      },
      description: String,
      dueDate: Date,
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: Date,
      weight: {
        type: Number,
        min: 1,
        max: 100,
        default: 10
      }
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Participants
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  applicants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    coverLetter: {
      type: String,
      maxLength: [1000, 'Cover letter cannot exceed 1000 characters']
    },
    proposedBudget: {
      amount: Number,
      currency: String,
      timeline: String
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Team and Collaboration
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['lead', 'contributor', 'reviewer', 'advisor'],
      default: 'contributor'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    permissions: [{
      type: String,
      enum: ['edit_task', 'manage_team', 'approve_changes', 'view_analytics']
    }]
  }],

  // Requirements and Deliverables
  requirements: {
    deliverables: [{
      type: String,
      required: true
    }],
    acceptanceCriteria: [{
      type: String,
      required: true
    }],
    testingRequirements: [{
      type: String
    }],
    documentationRequired: {
      type: Boolean,
      default: true
    },
    codeReviewRequired: {
      type: Boolean,
      default: false
    }
  },

  // Communication
  communication: {
    preferredMethods: [{
      type: String,
      enum: ['discord', 'slack', 'email', 'zoom', 'telegram', 'github']
    }],
    meetingSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'as-needed', 'none'],
        default: 'as-needed'
      },
      timezone: String,
      preferredTimes: [String] // e.g., ["09:00-17:00"]
    },
    responseTimeExpected: {
      type: String,
      enum: ['immediate', '1-hour', '4-hours', '24-hours', '48-hours'],
      default: '24-hours'
    }
  },

  // Attachments and Resources
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  resources: [{
    title: String,
    url: String,
    type: {
      type: String,
      enum: ['documentation', 'repository', 'design', 'reference', 'other']
    },
    description: String
  }],

  // Review and Rating
  review: {
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    overall: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: {
      type: String,
      maxLength: [1000, 'Review feedback cannot exceed 1000 characters']
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    wouldRecommend: {
      type: Boolean
    }
  },

  // Analytics and Metrics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    uniqueViews: {
      type: Number,
      default: 0
    },
    applicationsReceived: {
      type: Number,
      default: 0
    },
    averageApplicationTime: {
      type: Number,
      default: 0 // in hours
    },
    timeToComplete: {
      type: Number,
      default: 0 // in hours
    },
    completionEfficiency: {
      type: Number,
      default: 0 // percentage
    },
    budgetAccuracy: {
      type: Number,
      default: 0 // percentage
    }
  },

  // Visibility and Promotion
  visibility: {
    public: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    urgent: {
      type: Boolean,
      default: false
    },
    promoted: {
      endDate: Date,
      tier: {
        type: String,
        enum: ['basic', 'premium', 'platinum']
      }
    }
  },

  // Dispute and Support
  dispute: {
    isDisputed: {
      type: Boolean,
      default: false
    },
    disputeReason: String,
    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    disputedAt: Date,
    resolution: {
      status: {
        type: String,
        enum: ['pending', 'resolved', 'escalated']
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      resolvedAt: Date,
      resolution: String
    }
  },

  // History and Audit Trail
  history: [{
    action: {
      type: String,
      enum: [
        'created', 'updated', 'applied', 'assigned', 'started',
        'milestone_completed', 'completed', 'reviewed', 'cancelled',
        'disputed', 'resolved'
      ],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedAt: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String
  }],

  // Automation and AI
  automation: {
    autoAssign: {
      type: Boolean,
      default: false
    },
    aiGenerated: {
      type: Boolean,
      default: false
    },
    aiSuggestions: {
      skills: [String],
      budget: {
        suggested: Number,
        confidence: Number
      },
      timeline: {
        suggested: Number,
        confidence: Number
      }
    }
  },

  // Integration and External Links
  integrations: {
    github: {
      repository: String,
      issue: String,
      pullRequest: String
    },
    jira: {
      project: String,
      ticket: String
    },
    trello: {
      board: String,
      card: String
    },
    slack: {
      channel: String,
      threadId: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
taskSchema.index({ status: 1, createdAt: -1 });
taskSchema.index({ category: 1, subcategory: 1 });
taskSchema.index({ 'skillsRequired.name': 1, experienceLevel: 1 });
taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ 'budget.amount': 1, 'budget.type': 1 });
taskSchema.index({ 'timeline.endDate': 1, status: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ priority: 1, status: 1, createdAt: -1 });
taskSchema.index({ 'visibility.featured': 1, 'visibility.public': 1 });
taskSchema.index({ 'analytics.views': -1 });

// Compound indexes for complex queries
taskSchema.index({
  status: 1,
  category: 1,
  'budget.type': 1,
  experienceLevel: 1,
  createdAt: -1
});

taskSchema.index({
  'visibility.public': 1,
  'visibility.featured': 1,
  status: 1,
  'analytics.views': -1
});

// Text search index
taskSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'skillsRequired.name': 'text'
});

// Virtual fields
taskSchema.virtual('isExpired').get(function() {
  return this.timeline.endDate < new Date() && this.status !== 'completed';
});

taskSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.timeline.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

taskSchema.virtual('applicationCount').get(function() {
  return this.applicants ? this.applicants.length : 0;
});

taskSchema.virtual('teamSize').get(function() {
  return this.team ? this.team.length : 0;
});

// Pre-save middleware
taskSchema.pre('save', function(next) {
  // Update progress percentage based on milestones
  if (this.progress.milestones && this.progress.milestones.length > 0) {
    const completedWeight = this.progress.milestones
      .filter(m => m.completed)
      .reduce((sum, m) => sum + m.weight, 0);
    const totalWeight = this.progress.milestones
      .reduce((sum, m) => sum + m.weight, 0);

    if (totalWeight > 0) {
      this.progress.percentage = Math.round((completedWeight / totalWeight) * 100);
    }
  }

  // Auto-set shortDescription if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.length > 297
      ? this.description.substring(0, 297) + '...'
      : this.description;
  }

  // Update analytics
  this.analytics.applicationsReceived = this.applicants ? this.applicants.length : 0;

  next();
});

// Instance Methods
taskSchema.methods.addApplicant = function(userId, applicationData) {
  const existingApplication = this.applicants.find(
    app => app.user.toString() === userId.toString()
  );

  if (existingApplication) {
    throw new Error('User has already applied for this task');
  }

  this.applicants.push({
    user: userId,
    ...applicationData
  });

  this.analytics.applicationsReceived = this.applicants.length;

  // Add to history
  this.history.push({
    action: 'applied',
    performedBy: userId,
    details: { applicationData }
  });

  return this.save();
};

taskSchema.methods.assignToUser = function(userId, assignedBy) {
  if (this.status !== 'open' && this.status !== 'pending') {
    throw new Error('Task is not available for assignment');
  }

  this.assignedTo = userId;
  this.status = 'in_progress';

  // Update applicant status
  const applicant = this.applicants.find(
    app => app.user.toString() === userId.toString()
  );
  if (applicant) {
    applicant.status = 'accepted';
    applicant.reviewedAt = new Date();
    applicant.reviewedBy = assignedBy;
  }

  // Reject other applicants
  this.applicants.forEach(app => {
    if (app.user.toString() !== userId.toString() && app.status === 'pending') {
      app.status = 'rejected';
      app.reviewedAt = new Date();
      app.reviewedBy = assignedBy;
    }
  });

  // Add to history
  this.history.push({
    action: 'assigned',
    performedBy: assignedBy,
    details: { assignedTo: userId }
  });

  return this.save();
};

taskSchema.methods.updateProgress = function(milestoneId, completed = true, userId) {
  const milestone = this.progress.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  milestone.completed = completed;
  milestone.completedAt = completed ? new Date() : null;
  this.progress.lastUpdated = new Date();

  // Add to history
  this.history.push({
    action: 'milestone_completed',
    performedBy: userId,
    details: { milestoneId, milestone: milestone.title }
  });

  return this.save();
};

taskSchema.methods.markCompleted = function(userId) {
  this.status = 'completed';
  this.progress.percentage = 100;

  // Calculate completion metrics
  const createdAt = new Date(this.createdAt);
  const completedAt = new Date();
  const timeToComplete = (completedAt - createdAt) / (1000 * 60 * 60); // hours

  this.analytics.timeToComplete = timeToComplete;

  // Calculate efficiency (actual vs estimated)
  if (this.estimatedHours) {
    this.analytics.completionEfficiency =
      Math.round((this.estimatedHours / timeToComplete) * 100);
  }

  // Add to history
  this.history.push({
    action: 'completed',
    performedBy: userId,
    details: { completedAt, timeToComplete }
  });

  return this.save();
};

taskSchema.methods.addReview = function(reviewData, reviewerId) {
  this.review = {
    ...reviewData,
    reviewedBy: reviewerId,
    reviewedAt: new Date()
  };

  // Calculate overall rating
  const { quality, communication, timeliness } = reviewData;
  if (quality && communication && timeliness) {
    this.review.overall = Math.round((quality + communication + timeliness) / 3 * 10) / 10;
  }

  // Add to history
  this.history.push({
    action: 'reviewed',
    performedBy: reviewerId,
    details: { review: this.review }
  });

  return this.save();
};

// Static Methods
taskSchema.statics.findAvailableTasks = function(filters = {}) {
  return this.find({
    status: { $in: ['open', 'pending'] },
    'timeline.endDate': { $gte: new Date() },
    'visibility.public': true,
    ...filters
  }).populate('createdBy', 'name profile.avatar reputation.score');
};

taskSchema.statics.findFeaturedTasks = function(limit = 10) {
  return this.find({
    'visibility.featured': true,
    'visibility.public': true,
    status: { $in: ['open', 'pending'] }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('createdBy', 'name profile.avatar');
};

taskSchema.statics.searchTasks = function(query, filters = {}) {
  return this.find({
    $and: [
      {
        $or: [
          { $text: { $search: query } },
          { title: new RegExp(query, 'i') },
          { tags: new RegExp(query, 'i') }
        ]
      },
      {
        status: { $in: ['open', 'pending'] },
        'visibility.public': true
      },
      filters
    ]
  }).populate('createdBy', 'name profile.avatar');
};

taskSchema.statics.getTaskAnalytics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageBudget: { $avg: '$budget.amount' },
        averageCompletionTime: { $avg: '$analytics.timeToComplete' },
        totalViews: { $sum: '$analytics.views' }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

module.exports = mongoose.model('Task', taskSchema);