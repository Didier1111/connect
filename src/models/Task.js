const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    description: {
        type: String,
        required: true,
        maxLength: 2000
    },
    taskType: {
        type: String,
        required: true,
        enum: [
            'bug_fix',
            'feature_development',
            'documentation',
            'code_review',
            'testing',
            'refactoring',
            'security_fix',
            'performance_optimization',
            'ui_improvement',
            'api_development'
        ]
    },
    difficulty: {
        type: String,
        required: true,
        enum: ['easy', 'medium', 'hard', 'expert']
    },
    status: {
        type: String,
        default: 'open',
        enum: ['open', 'assigned', 'in_progress', 'review', 'completed', 'rejected']
    },
    priority: {
        type: String,
        default: 'medium',
        enum: ['low', 'medium', 'high', 'urgent']
    },
    pointsReward: {
        type: Number,
        required: true,
        min: 1
    },
    estimatedHours: {
        type: Number,
        min: 0.5,
        max: 40
    },
    tags: [{
        type: String,
        trim: true
    }],
    skillsRequired: [{
        skill: String,
        level: {
            type: Number,
            min: 1,
            max: 5
        }
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewers: [{
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'changes_requested']
        },
        feedback: String,
        reviewedAt: Date
    }],
    deliverables: [{
        type: String,
        description: String
    }],
    acceptanceCriteria: [{
        criterion: String,
        completed: {
            type: Boolean,
            default: false
        }
    }],
    repository: {
        url: String,
        branch: String,
        pullRequestUrl: String
    },
    dueDate: Date,
    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,
    timeSpent: {
        type: Number, // in hours
        default: 0
    },
    submissions: [{
        submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        submissionUrl: String,
        description: String,
        submittedAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],
    bonusMultiplier: {
        type: Number,
        default: 1.0,
        min: 1.0,
        max: 3.0
    },
    isUrgent: {
        type: Boolean,
        default: false
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }
}, {
    timestamps: true
});

// Index for efficient queries
taskSchema.index({ status: 1, difficulty: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ skillsRequired: 1 });
taskSchema.index({ createdAt: -1 });

// Calculate points based on difficulty and type
taskSchema.methods.calculatePoints = function() {
    const basePoints = {
        easy: 10,
        medium: 25,
        hard: 50,
        expert: 100
    };

    const typeMultiplier = {
        bug_fix: 1.2,
        feature_development: 1.5,
        documentation: 0.8,
        code_review: 1.0,
        testing: 1.1,
        refactoring: 1.3,
        security_fix: 2.0,
        performance_optimization: 1.4,
        ui_improvement: 1.1,
        api_development: 1.6
    };

    const urgencyBonus = this.isUrgent ? 1.5 : 1.0;

    this.pointsReward = Math.round(
        basePoints[this.difficulty] *
        (typeMultiplier[this.taskType] || 1.0) *
        this.bonusMultiplier *
        urgencyBonus
    );

    return this.pointsReward;
};

// Assign task to contributor
taskSchema.methods.assignTo = function(contributorId) {
    this.assignedTo = contributorId;
    this.status = 'assigned';
    this.assignedAt = new Date();
    return this.save();
};

// Start working on task
taskSchema.methods.startWork = function() {
    this.status = 'in_progress';
    this.startedAt = new Date();
    return this.save();
};

// Submit task for review
taskSchema.methods.submitForReview = function(submissionData) {
    this.submissions.push(submissionData);
    this.status = 'review';
    return this.save();
};

// Complete task
taskSchema.methods.complete = function(completedBy) {
    this.status = 'completed';
    this.completedBy = completedBy;
    this.completedAt = new Date();
    return this.save();
};

// Get available tasks for contributor based on skills
taskSchema.statics.getAvailableTasks = function(contributorSkills, limit = 10) {
    const skillNames = contributorSkills.map(s => s.skill);

    return this.find({
        status: 'open',
        'skillsRequired.skill': { $in: skillNames }
    })
    .sort({ createdAt: -1, pointsReward: -1 })
    .limit(limit)
    .populate('createdBy', 'username')
    .populate('projectId', 'name');
};

// Get high-priority tasks
taskSchema.statics.getHighPriorityTasks = function() {
    return this.find({
        status: 'open',
        $or: [
            { priority: 'urgent' },
            { priority: 'high' },
            { isUrgent: true }
        ]
    })
    .sort({ priority: -1, pointsReward: -1 })
    .populate('createdBy', 'username')
    .populate('projectId', 'name');
};

// Get tasks by contributor
taskSchema.statics.getContributorTasks = function(contributorId, status = null) {
    const query = { assignedTo: contributorId };
    if (status) {
        query.status = status;
    }

    return this.find(query)
        .sort({ assignedAt: -1 })
        .populate('createdBy', 'username')
        .populate('projectId', 'name');
};

// Pre-save middleware to calculate points
taskSchema.pre('save', function(next) {
    if (this.isNew || this.isModified(['difficulty', 'taskType', 'bonusMultiplier', 'isUrgent'])) {
        this.calculatePoints();
    }
    next();
});

module.exports = mongoose.model('Task', taskSchema);