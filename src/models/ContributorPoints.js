const mongoose = require('mongoose');

const contributorPointsSchema = new mongoose.Schema({
    contributorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    weeklyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    monthlyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    qualificationLevel: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze'
    },
    revenueSharePercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 20
    },
    completedTasks: [{
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        pointsAwarded: {
            type: Number,
            required: true
        },
        completedAt: {
            type: Date,
            default: Date.now
        },
        taskType: {
            type: String,
            required: true
        },
        difficulty: {
            type: String,
            enum: ['easy', 'medium', 'hard', 'expert'],
            required: true
        }
    }],
    streakDays: {
        type: Number,
        default: 0
    },
    lastActiveDate: {
        type: Date,
        default: Date.now
    },
    achievements: [{
        type: String,
        enum: [
            'first_task_completed',
            'week_streak',
            'month_streak',
            'code_reviewer',
            'bug_hunter',
            'feature_master',
            'documentation_expert',
            'mentor_contributor',
            'project_leader'
        ]
    }],
    specializations: [{
        skill: String,
        proficiencyLevel: {
            type: Number,
            min: 1,
            max: 5
        },
        pointsEarned: Number
    }]
}, {
    timestamps: true
});

// Calculate qualification level based on points
contributorPointsSchema.methods.updateQualificationLevel = function() {
    const points = this.totalPoints;

    if (points >= 10000) {
        this.qualificationLevel = 'diamond';
        this.revenueSharePercentage = 20;
    } else if (points >= 5000) {
        this.qualificationLevel = 'platinum';
        this.revenueSharePercentage = 15;
    } else if (points >= 2000) {
        this.qualificationLevel = 'gold';
        this.revenueSharePercentage = 12;
    } else if (points >= 500) {
        this.qualificationLevel = 'silver';
        this.revenueSharePercentage = 8;
    } else {
        this.qualificationLevel = 'bronze';
        this.revenueSharePercentage = 5;
    }

    return this.save();
};

// Add points for completed task
contributorPointsSchema.methods.addTaskPoints = function(taskData) {
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
        security_fix: 2.0
    };

    const pointsAwarded = Math.round(
        basePoints[taskData.difficulty] *
        (typeMultiplier[taskData.taskType] || 1.0)
    );

    // Add bonus points for streak
    const streakBonus = Math.min(this.streakDays * 0.1, 2.0);
    const finalPoints = Math.round(pointsAwarded * (1 + streakBonus));

    this.totalPoints += finalPoints;
    this.weeklyPoints += finalPoints;
    this.monthlyPoints += finalPoints;

    this.completedTasks.push({
        taskId: taskData.taskId,
        pointsAwarded: finalPoints,
        taskType: taskData.taskType,
        difficulty: taskData.difficulty
    });

    this.lastActiveDate = new Date();
    this.updateStreak();
    this.updateQualificationLevel();

    return finalPoints;
};

// Update activity streak
contributorPointsSchema.methods.updateStreak = function() {
    const today = new Date();
    const lastActive = new Date(this.lastActiveDate);
    const daysDiff = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));

    if (daysDiff === 1) {
        this.streakDays += 1;
    } else if (daysDiff > 1) {
        this.streakDays = 1;
    }
    // If daysDiff === 0, maintain current streak
};

// Reset weekly points (called by cron job)
contributorPointsSchema.statics.resetWeeklyPoints = function() {
    return this.updateMany({}, { weeklyPoints: 0 });
};

// Reset monthly points (called by cron job)
contributorPointsSchema.statics.resetMonthlyPoints = function() {
    return this.updateMany({}, { monthlyPoints: 0 });
};

// Get leaderboard data
contributorPointsSchema.statics.getLeaderboard = function(period = 'total', limit = 10) {
    const sortField = period === 'weekly' ? 'weeklyPoints' :
                     period === 'monthly' ? 'monthlyPoints' : 'totalPoints';

    return this.find({})
        .populate('contributorId', 'username email avatar')
        .sort({ [sortField]: -1 })
        .limit(limit)
        .select('contributorId totalPoints weeklyPoints monthlyPoints qualificationLevel revenueSharePercentage achievements streakDays');
};

// Calculate revenue share for contributor
contributorPointsSchema.methods.calculateRevenueShare = function(totalRevenue) {
    const shareAmount = totalRevenue * (this.revenueSharePercentage / 100);
    return {
        percentage: this.revenueSharePercentage,
        amount: shareAmount,
        qualificationLevel: this.qualificationLevel,
        totalPoints: this.totalPoints
    };
};

module.exports = mongoose.model('ContributorPoints', contributorPointsSchema);