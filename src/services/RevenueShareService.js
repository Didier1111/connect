const ContributorPoints = require('../models/ContributorPoints');
const Task = require('../models/Task');

class RevenueShareService {
    constructor() {
        this.qualificationCriteria = {
            bronze: {
                minPoints: 0,
                revenueShare: 5,
                requirements: [
                    'Complete first task',
                    'Maintain basic activity'
                ]
            },
            silver: {
                minPoints: 500,
                revenueShare: 8,
                requirements: [
                    '500+ total points',
                    'Complete 20+ tasks',
                    '7+ day activity streak'
                ]
            },
            gold: {
                minPoints: 2000,
                revenueShare: 12,
                requirements: [
                    '2000+ total points',
                    'Complete 75+ tasks',
                    '14+ day activity streak',
                    'Mentor 2+ contributors'
                ]
            },
            platinum: {
                minPoints: 5000,
                revenueShare: 15,
                requirements: [
                    '5000+ total points',
                    'Complete 150+ tasks',
                    '30+ day activity streak',
                    'Lead project or feature',
                    'High code review rating'
                ]
            },
            diamond: {
                minPoints: 10000,
                revenueShare: 20,
                requirements: [
                    '10000+ total points',
                    'Complete 300+ tasks',
                    '60+ day activity streak',
                    'Lead multiple projects',
                    'Exceptional code quality',
                    'Community leadership'
                ]
            }
        };

        this.taskPointValues = {
            // Difficulty base points
            easy: 10,
            medium: 25,
            hard: 50,
            expert: 100,

            // Task type multipliers
            multipliers: {
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
            },

            // Bonus conditions
            bonuses: {
                urgent_task: 1.5,
                weekend_work: 1.2,
                first_contribution: 2.0,
                streak_bonus: 0.1, // per day, max 2.0x
                quality_bonus: 1.3,
                innovation_bonus: 1.5
            }
        };
    }

    /**
     * Calculate points for a completed task
     */
    calculateTaskPoints(taskData) {
        const basePoints = this.taskPointValues[taskData.difficulty] || 25;
        const typeMultiplier = this.taskPointValues.multipliers[taskData.taskType] || 1.0;

        let bonusMultiplier = 1.0;

        // Apply bonuses
        if (taskData.isUrgent) bonusMultiplier *= this.taskPointValues.bonuses.urgent_task;
        if (taskData.isWeekendWork) bonusMultiplier *= this.taskPointValues.bonuses.weekend_work;
        if (taskData.isFirstContribution) bonusMultiplier *= this.taskPointValues.bonuses.first_contribution;
        if (taskData.highQuality) bonusMultiplier *= this.taskPointValues.bonuses.quality_bonus;
        if (taskData.innovative) bonusMultiplier *= this.taskPointValues.bonuses.innovation_bonus;

        // Streak bonus calculation
        const streakDays = taskData.streakDays || 0;
        const streakBonus = Math.min(streakDays * this.taskPointValues.bonuses.streak_bonus, 2.0);
        bonusMultiplier *= (1 + streakBonus);

        const finalPoints = Math.round(basePoints * typeMultiplier * bonusMultiplier);
        return finalPoints;
    }

    /**
     * Award points to contributor for completed task
     */
    async awardTaskPoints(contributorId, taskData) {
        try {
            let contributorPoints = await ContributorPoints.findOne({ contributorId });

            if (!contributorPoints) {
                contributorPoints = new ContributorPoints({ contributorId });
            }

            const pointsAwarded = contributorPoints.addTaskPoints(taskData);
            await contributorPoints.save();

            return {
                success: true,
                pointsAwarded,
                totalPoints: contributorPoints.totalPoints,
                newLevel: contributorPoints.qualificationLevel,
                revenueSharePercentage: contributorPoints.revenueSharePercentage
            };
        } catch (error) {
            console.error('Error awarding task points:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get contributor's current status and earnings potential
     */
    async getContributorStatus(contributorId) {
        try {
            const contributorPoints = await ContributorPoints.findOne({ contributorId })
                .populate('contributorId', 'username email');

            if (!contributorPoints) {
                return {
                    level: 'bronze',
                    totalPoints: 0,
                    revenueShare: 5,
                    nextLevelRequirements: this.getNextLevelRequirements('bronze'),
                    estimatedMonthlyEarnings: 0
                };
            }

            const nextLevel = this.getNextLevel(contributorPoints.qualificationLevel);
            const monthlyProjections = await this.calculateMonthlyEarnings(contributorPoints);

            return {
                level: contributorPoints.qualificationLevel,
                totalPoints: contributorPoints.totalPoints,
                weeklyPoints: contributorPoints.weeklyPoints,
                monthlyPoints: contributorPoints.monthlyPoints,
                revenueShare: contributorPoints.revenueSharePercentage,
                streakDays: contributorPoints.streakDays,
                achievements: contributorPoints.achievements,
                nextLevel,
                nextLevelRequirements: nextLevel ? this.getNextLevelRequirements(nextLevel) : null,
                estimatedMonthlyEarnings: monthlyProjections
            };
        } catch (error) {
            console.error('Error getting contributor status:', error);
            return { error: error.message };
        }
    }

    /**
     * Calculate monthly earnings projection
     */
    async calculateMonthlyEarnings(contributorPoints) {
        // Base monthly revenue projections for the platform
        const monthlyRevenue = {
            conservative: 15000, // $15K/month
            realistic: 35000,    // $35K/month
            optimistic: 75000    // $75K/month
        };

        const revenueShare = contributorPoints.revenueSharePercentage / 100;

        return {
            conservative: Math.round(monthlyRevenue.conservative * revenueShare),
            realistic: Math.round(monthlyRevenue.realistic * revenueShare),
            optimistic: Math.round(monthlyRevenue.optimistic * revenueShare),
            based_on_percentage: contributorPoints.revenueSharePercentage
        };
    }

    /**
     * Get leaderboard with revenue share information
     */
    async getLeaderboard(period = 'total', limit = 10) {
        try {
            const leaderboard = await ContributorPoints.getLeaderboard(period, limit);

            return leaderboard.map(contributor => ({
                contributor: contributor.contributorId,
                points: {
                    total: contributor.totalPoints,
                    weekly: contributor.weeklyPoints,
                    monthly: contributor.monthlyPoints
                },
                level: contributor.qualificationLevel,
                revenueShare: contributor.revenueSharePercentage,
                streakDays: contributor.streakDays,
                achievements: contributor.achievements,
                estimatedMonthlyEarnings: this.calculateMonthlyEarningsSync(contributor.revenueSharePercentage)
            }));
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return { error: error.message };
        }
    }

    /**
     * Distribute revenue to qualified contributors
     */
    async distributeRevenue(totalRevenue) {
        try {
            const qualifiedContributors = await ContributorPoints.find({
                totalPoints: { $gte: 100 }, // Minimum qualification
                lastActiveDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
            }).populate('contributorId', 'username email paymentInfo');

            const distributions = [];
            let totalDistributed = 0;

            for (const contributor of qualifiedContributors) {
                const share = contributor.calculateRevenueShare(totalRevenue);
                distributions.push({
                    contributorId: contributor.contributorId._id,
                    contributor: contributor.contributorId,
                    points: contributor.totalPoints,
                    level: contributor.qualificationLevel,
                    percentage: share.percentage,
                    amount: share.amount
                });
                totalDistributed += share.amount;
            }

            return {
                success: true,
                totalRevenue,
                totalDistributed,
                remainingRevenue: totalRevenue - totalDistributed,
                distributions: distributions.sort((a, b) => b.amount - a.amount)
            };
        } catch (error) {
            console.error('Error distributing revenue:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create tasks for contributors based on their skill level
     */
    async createTasksForContributors() {
        const sampleTasks = [
            {
                title: "Fix responsive layout bug on mobile devices",
                description: "The navigation menu collapses incorrectly on screens smaller than 768px. Fix the CSS media queries and test on various devices.",
                taskType: "bug_fix",
                difficulty: "medium",
                skillsRequired: [
                    { skill: "CSS", level: 3 },
                    { skill: "Responsive Design", level: 3 }
                ],
                estimatedHours: 2,
                tags: ["frontend", "css", "mobile", "responsive"]
            },
            {
                title: "Implement user authentication API endpoints",
                description: "Create secure login, logout, and registration endpoints using JWT tokens. Include input validation and rate limiting.",
                taskType: "api_development",
                difficulty: "hard",
                skillsRequired: [
                    { skill: "Node.js", level: 4 },
                    { skill: "Express", level: 3 },
                    { skill: "JWT", level: 3 },
                    { skill: "Security", level: 4 }
                ],
                estimatedHours: 6,
                tags: ["backend", "api", "authentication", "security"]
            },
            {
                title: "Write documentation for contributor onboarding",
                description: "Create comprehensive documentation explaining how new contributors can get started, including setup instructions and coding standards.",
                taskType: "documentation",
                difficulty: "easy",
                skillsRequired: [
                    { skill: "Technical Writing", level: 3 },
                    { skill: "Markdown", level: 2 }
                ],
                estimatedHours: 3,
                tags: ["documentation", "onboarding", "contributors"]
            },
            {
                title: "Optimize database queries for better performance",
                description: "Profile and optimize slow database queries in the user dashboard. Add appropriate indexes and consider query restructuring.",
                taskType: "performance_optimization",
                difficulty: "expert",
                skillsRequired: [
                    { skill: "MongoDB", level: 4 },
                    { skill: "Database Optimization", level: 4 },
                    { skill: "Performance Analysis", level: 3 }
                ],
                estimatedHours: 8,
                tags: ["database", "performance", "optimization", "mongodb"]
            },
            {
                title: "Add unit tests for payment processing module",
                description: "Write comprehensive unit tests for the Stripe payment integration, covering success cases, failures, and edge cases.",
                taskType: "testing",
                difficulty: "medium",
                skillsRequired: [
                    { skill: "Jest", level: 3 },
                    { skill: "Unit Testing", level: 3 },
                    { skill: "JavaScript", level: 3 }
                ],
                estimatedHours: 4,
                tags: ["testing", "payments", "jest", "unit-tests"]
            }
        ];

        const createdTasks = [];

        for (const taskData of sampleTasks) {
            try {
                const task = new Task({
                    ...taskData,
                    createdBy: null, // System-generated task
                    status: 'open',
                    priority: 'medium',
                    isUrgent: Math.random() > 0.8 // 20% chance of being urgent
                });

                await task.save();
                createdTasks.push(task);
            } catch (error) {
                console.error('Error creating task:', error);
            }
        }

        return createdTasks;
    }

    /**
     * Get next qualification level
     */
    getNextLevel(currentLevel) {
        const levels = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
    }

    /**
     * Get requirements for next level
     */
    getNextLevelRequirements(level) {
        return this.qualificationCriteria[level] || null;
    }

    /**
     * Synchronous monthly earnings calculation
     */
    calculateMonthlyEarningsSync(revenueSharePercentage) {
        const monthlyRevenue = {
            conservative: 15000,
            realistic: 35000,
            optimistic: 75000
        };

        const revenueShare = revenueSharePercentage / 100;

        return {
            conservative: Math.round(monthlyRevenue.conservative * revenueShare),
            realistic: Math.round(monthlyRevenue.realistic * revenueShare),
            optimistic: Math.round(monthlyRevenue.optimistic * revenueShare)
        };
    }
}

module.exports = new RevenueShareService();