// src/models/Analytics.js
// Data aggregation schemas for dashboard statistics and analytics

const mongoose = require('mongoose');

// Daily aggregated metrics schema
const dailyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },

  // User Metrics
  users: {
    new: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    verified: { type: Number, default: 0 },
    suspended: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },

  // Task Metrics
  tasks: {
    created: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    inProgress: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    averageBudget: { type: Number, default: 0 },
    totalBudget: { type: Number, default: 0 }
  },

  // Payment Metrics
  payments: {
    processed: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    refunded: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    averageAmount: { type: Number, default: 0 },
    fees: { type: Number, default: 0 }
  },

  // Activity Metrics
  activity: {
    logins: { type: Number, default: 0 },
    pageViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    averageSessionDuration: { type: Number, default: 0 },
    bounceRate: { type: Number, default: 0 }
  },

  // Performance Metrics
  performance: {
    averageResponseTime: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    uptime: { type: Number, default: 100 },
    throughput: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// User analytics schema for individual user metrics
const userAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Profile Analytics
  profile: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    endorsements: { type: Number, default: 0 }
  },

  // Task Analytics
  tasks: {
    created: { type: Number, default: 0 },
    completed: { type: Number, default: 0 },
    cancelled: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    onTimeDelivery: { type: Number, default: 0 },
    repeatClients: { type: Number, default: 0 }
  },

  // Financial Analytics
  earnings: {
    total: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    thisYear: { type: Number, default: 0 },
    averagePerTask: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 }
  },

  // Performance Analytics
  performance: {
    responseTime: { type: Number, default: 0 }, // hours
    qualityScore: { type: Number, default: 0 },
    communicationScore: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 }
  },

  // Activity Analytics
  activity: {
    totalHoursWorked: { type: Number, default: 0 },
    activeMonths: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    streaks: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 }
    }
  },

  // Growth Analytics
  growth: {
    rankingPosition: { type: Number, default: 0 },
    skillsGrowth: [{
      skill: String,
      startLevel: Number,
      currentLevel: Number,
      improvementRate: Number
    }],
    reputationGrowth: [{
      month: String,
      score: Number
    }]
  },

  // Last updated timestamp
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Task analytics schema
const taskAnalyticsSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
    unique: true
  },

  // Visibility Analytics
  visibility: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    clickThroughRate: { type: Number, default: 0 }
  },

  // Application Analytics
  applications: {
    total: { type: Number, default: 0 },
    qualified: { type: Number, default: 0 },
    averageProposalTime: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 }
  },

  // Performance Analytics
  performance: {
    timeToComplete: { type: Number, default: 0 },
    budgetAccuracy: { type: Number, default: 0 },
    qualityRating: { type: Number, default: 0 },
    clientSatisfaction: { type: Number, default: 0 }
  },

  // Geographic Analytics
  geography: {
    applicantCountries: [{
      country: String,
      count: Number
    }],
    viewerCountries: [{
      country: String,
      count: Number
    }]
  },

  // Traffic Sources
  trafficSources: [{
    source: {
      type: String,
      enum: ['search', 'direct', 'referral', 'social', 'email', 'featured']
    },
    count: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],

  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Platform-wide analytics schema
const platformAnalyticsSchema = new mongoose.Schema({
  period: {
    type: String,
    required: true,
    enum: ['hour', 'day', 'week', 'month', 'quarter', 'year']
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // Key Performance Indicators
  kpis: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalTransactionVolume: { type: Number, default: 0 },
    averageTaskValue: { type: Number, default: 0 },
    platformRevenue: { type: Number, default: 0 },
    customerSatisfaction: { type: Number, default: 0 }
  },

  // Growth Metrics
  growth: {
    userGrowthRate: { type: Number, default: 0 },
    taskGrowthRate: { type: Number, default: 0 },
    revenueGrowthRate: { type: Number, default: 0 },
    retentionRate: { type: Number, default: 0 },
    churnRate: { type: Number, default: 0 }
  },

  // Market Metrics
  market: {
    topCategories: [{
      category: String,
      count: Number,
      revenue: Number
    }],
    topSkills: [{
      skill: String,
      demand: Number,
      avgRate: Number
    }],
    competitorAnalysis: [{
      metric: String,
      ourValue: Number,
      marketAverage: Number,
      percentile: Number
    }]
  },

  // Quality Metrics
  quality: {
    averageTaskRating: { type: Number, default: 0 },
    averageUserRating: { type: Number, default: 0 },
    disputeRate: { type: Number, default: 0 },
    resolutionTime: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Revenue analytics schema
const revenueAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },

  // Revenue Breakdown
  revenue: {
    gross: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 },
    chargebacks: { type: Number, default: 0 }
  },

  // Revenue by Source
  sources: [{
    type: {
      type: String,
      enum: ['task_fees', 'subscription', 'premium_listings', 'advertising', 'partnerships']
    },
    amount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 }
  }],

  // Revenue by Category
  categories: [{
    category: String,
    amount: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }],

  // Payment Methods
  paymentMethods: [{
    method: String,
    amount: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
    fees: { type: Number, default: 0 }
  }],

  // Geographic Revenue
  geography: [{
    country: String,
    amount: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

// Indexes for performance optimization
dailyMetricsSchema.index({ date: -1 });
userAnalyticsSchema.index({ userId: 1 });
userAnalyticsSchema.index({ 'performance.overallScore': -1 });
userAnalyticsSchema.index({ 'earnings.total': -1 });
taskAnalyticsSchema.index({ taskId: 1 });
taskAnalyticsSchema.index({ 'visibility.views': -1 });
platformAnalyticsSchema.index({ period: 1, startDate: -1 });
revenueAnalyticsSchema.index({ date: -1 });

// Static methods for DailyMetrics
dailyMetricsSchema.statics.getMetricsForDateRange = function(startDate, endDate) {
  return this.find({
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ date: 1 });
};

dailyMetricsSchema.statics.aggregateMetrics = async function(date) {
  const User = mongoose.model('User');
  const Task = mongoose.model('Task');
  const Payment = mongoose.model('Payment');
  const ActivityLog = mongoose.model('ActivityLog');

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Aggregate user metrics
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const activeUsers = await ActivityLog.distinct('actor.userId', {
    createdAt: { $gte: startOfDay, $lte: endOfDay },
    'actor.actorType': 'user'
  }).then(users => users.length);

  // Aggregate task metrics
  const tasksCreated = await Task.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const tasksCompleted = await Task.countDocuments({
    updatedAt: { $gte: startOfDay, $lte: endOfDay },
    status: 'completed'
  });

  // Aggregate payment metrics
  const paymentsProcessed = await Payment.countDocuments({
    processedAt: { $gte: startOfDay, $lte: endOfDay },
    status: 'completed'
  });

  const totalPaymentAmount = await Payment.aggregate([
    {
      $match: {
        processedAt: { $gte: startOfDay, $lte: endOfDay },
        status: 'completed'
      }
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]).then(result => result[0]?.total || 0);

  const metrics = {
    date: startOfDay,
    users: { new: newUsers, active: activeUsers },
    tasks: { created: tasksCreated, completed: tasksCompleted },
    payments: { processed: paymentsProcessed, totalAmount: totalPaymentAmount }
  };

  return this.findOneAndUpdate(
    { date: startOfDay },
    { $set: metrics },
    { upsert: true, new: true }
  );
};

// Static methods for UserAnalytics
userAnalyticsSchema.statics.updateUserAnalytics = async function(userId) {
  const User = mongoose.model('User');
  const Task = mongoose.model('Task');
  const Contract = mongoose.model('Contract');
  const Payment = mongoose.model('Payment');

  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const tasksCreated = await Task.countDocuments({ createdBy: userId });
  const tasksCompleted = await Task.countDocuments({
    assignedTo: userId,
    status: 'completed'
  });

  const contracts = await Contract.find({
    $or: [{ contributorId: userId }, { agentId: userId }],
    status: 'completed'
  });

  let totalEarnings = 0;
  for (const contract of contracts) {
    const payments = await Payment.find({
      contractId: contract._id,
      status: 'completed'
    });
    totalEarnings += payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  const analytics = {
    userId,
    tasks: { created: tasksCreated, completed: tasksCompleted },
    earnings: { total: totalEarnings },
    lastCalculated: new Date()
  };

  return this.findOneAndUpdate(
    { userId },
    { $set: analytics },
    { upsert: true, new: true }
  );
};

// Export models
const DailyMetrics = mongoose.model('DailyMetrics', dailyMetricsSchema);
const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);
const TaskAnalytics = mongoose.model('TaskAnalytics', taskAnalyticsSchema);
const PlatformAnalytics = mongoose.model('PlatformAnalytics', platformAnalyticsSchema);
const RevenueAnalytics = mongoose.model('RevenueAnalytics', revenueAnalyticsSchema);

module.exports = {
  DailyMetrics,
  UserAnalytics,
  TaskAnalytics,
  PlatformAnalytics,
  RevenueAnalytics
};