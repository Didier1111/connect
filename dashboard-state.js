// Dashboard State Management - Project Connect
// Centralized state management with localStorage persistence and event-driven updates

class DashboardState {
    constructor() {
        this.listeners = new Map();
        this.state = {
            user: {
                id: null,
                firstName: '',
                lastName: '',
                email: '',
                bio: '',
                location: '',
                timezone: 'PST',
                avatar: '',
                tier: 'gold',
                joinDate: null,
                lastActive: null
            },
            stats: {
                totalEarnings: 0,
                activeTasks: 0,
                completionRate: 0,
                globalRank: 0,
                monthlyEarnings: 0,
                weeklyEarnings: 0
            },
            tasks: [],
            earnings: {
                transactions: [],
                revenueBreakdown: {
                    challenges: 0,
                    projects: 0,
                    bonuses: 0
                },
                tierProgress: {
                    currentTier: 'gold',
                    currentPoints: 750,
                    nextTier: 'platinum',
                    pointsToNext: 250,
                    totalPoints: 1000
                }
            },
            challenges: [],
            activities: [],
            skills: [],
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: true,
                emailNotifications: true,
                viewMode: 'grid',
                chartPeriod: 30
            },
            session: {
                lastSync: null,
                unsavedChanges: false,
                activeTab: 'dashboard',
                sidebarCollapsed: false
            }
        };

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupAutoSave();
        this.loadMockData(); // For demonstration purposes
    }

    // Event system for state changes
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    // State getters
    getUser() {
        return { ...this.state.user };
    }

    getStats() {
        return { ...this.state.stats };
    }

    getTasks() {
        return [...this.state.tasks];
    }

    getEarnings() {
        return { ...this.state.earnings };
    }

    getChallenges() {
        return [...this.state.challenges];
    }

    getActivities() {
        return [...this.state.activities];
    }

    getSkills() {
        return [...this.state.skills];
    }

    getPreferences() {
        return { ...this.state.preferences };
    }

    getSession() {
        return { ...this.state.session };
    }

    // State setters
    updateUser(updates) {
        const oldUser = { ...this.state.user };
        this.state.user = { ...this.state.user, ...updates };
        this.state.session.unsavedChanges = true;
        this.emit('userUpdated', { old: oldUser, new: this.state.user });
        this.saveToStorage();
    }

    updateStats(updates) {
        const oldStats = { ...this.state.stats };
        this.state.stats = { ...this.state.stats, ...updates };
        this.emit('statsUpdated', { old: oldStats, new: this.state.stats });
        this.saveToStorage();
    }

    addTask(task) {
        const newTask = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...task
        };
        this.state.tasks.push(newTask);
        this.emit('taskAdded', newTask);
        this.saveToStorage();
        return newTask;
    }

    updateTask(taskId, updates) {
        const index = this.state.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            const oldTask = { ...this.state.tasks[index] };
            this.state.tasks[index] = {
                ...this.state.tasks[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.emit('taskUpdated', { old: oldTask, new: this.state.tasks[index] });
            this.saveToStorage();
            return this.state.tasks[index];
        }
        return null;
    }

    removeTask(taskId) {
        const index = this.state.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            const removedTask = this.state.tasks.splice(index, 1)[0];
            this.emit('taskRemoved', removedTask);
            this.saveToStorage();
            return removedTask;
        }
        return null;
    }

    addTransaction(transaction) {
        const newTransaction = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...transaction
        };
        this.state.earnings.transactions.unshift(newTransaction);

        // Update stats
        this.state.stats.totalEarnings += transaction.amount;

        // Update revenue breakdown
        if (transaction.type === 'challenge') {
            this.state.earnings.revenueBreakdown.challenges += transaction.amount;
        } else if (transaction.type === 'project') {
            this.state.earnings.revenueBreakdown.projects += transaction.amount;
        } else if (transaction.type === 'bonus') {
            this.state.earnings.revenueBreakdown.bonuses += transaction.amount;
        }

        this.emit('transactionAdded', newTransaction);
        this.saveToStorage();
        return newTransaction;
    }

    addChallenge(challenge) {
        const newChallenge = {
            id: Date.now().toString(),
            joinedAt: new Date().toISOString(),
            ...challenge
        };
        this.state.challenges.push(newChallenge);
        this.emit('challengeAdded', newChallenge);
        this.saveToStorage();
        return newChallenge;
    }

    updateChallenge(challengeId, updates) {
        const index = this.state.challenges.findIndex(c => c.id === challengeId);
        if (index !== -1) {
            const oldChallenge = { ...this.state.challenges[index] };
            this.state.challenges[index] = {
                ...this.state.challenges[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.emit('challengeUpdated', { old: oldChallenge, new: this.state.challenges[index] });
            this.saveToStorage();
            return this.state.challenges[index];
        }
        return null;
    }

    addActivity(activity) {
        const newActivity = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            ...activity
        };
        this.state.activities.unshift(newActivity);

        // Keep only last 50 activities
        if (this.state.activities.length > 50) {
            this.state.activities = this.state.activities.slice(0, 50);
        }

        this.emit('activityAdded', newActivity);
        this.saveToStorage();
        return newActivity;
    }

    addSkill(skill) {
        const existingIndex = this.state.skills.findIndex(s => s.name.toLowerCase() === skill.name.toLowerCase());
        if (existingIndex !== -1) {
            // Update existing skill
            this.state.skills[existingIndex] = { ...this.state.skills[existingIndex], ...skill };
            this.emit('skillUpdated', this.state.skills[existingIndex]);
        } else {
            // Add new skill
            const newSkill = {
                id: Date.now().toString(),
                addedAt: new Date().toISOString(),
                level: 1,
                verified: false,
                ...skill
            };
            this.state.skills.push(newSkill);
            this.emit('skillAdded', newSkill);
        }
        this.saveToStorage();
    }

    removeSkill(skillId) {
        const index = this.state.skills.findIndex(skill => skill.id === skillId);
        if (index !== -1) {
            const removedSkill = this.state.skills.splice(index, 1)[0];
            this.emit('skillRemoved', removedSkill);
            this.saveToStorage();
            return removedSkill;
        }
        return null;
    }

    updatePreferences(updates) {
        const oldPreferences = { ...this.state.preferences };
        this.state.preferences = { ...this.state.preferences, ...updates };
        this.emit('preferencesUpdated', { old: oldPreferences, new: this.state.preferences });
        this.saveToStorage();
    }

    updateSession(updates) {
        this.state.session = { ...this.state.session, ...updates };
        this.emit('sessionUpdated', this.state.session);
        // Don't save session data to localStorage, it's temporary
    }

    // Persistence methods
    saveToStorage() {
        try {
            // Save user preferences
            localStorage.setItem('dashboardPreferences', JSON.stringify(this.state.preferences));

            // Save user data
            const userData = {
                user: this.state.user,
                stats: this.state.stats,
                tasks: this.state.tasks,
                earnings: this.state.earnings,
                challenges: this.state.challenges,
                skills: this.state.skills
            };
            localStorage.setItem('dashboardData', JSON.stringify(userData));

            // Save activities (limited to last 20 for storage)
            const recentActivities = this.state.activities.slice(0, 20);
            localStorage.setItem('dashboardActivities', JSON.stringify(recentActivities));

            this.state.session.lastSync = new Date().toISOString();
            this.emit('dataSaved', { timestamp: this.state.session.lastSync });
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.emit('saveError', error);
        }
    }

    loadFromStorage() {
        try {
            // Load preferences
            const savedPreferences = localStorage.getItem('dashboardPreferences');
            if (savedPreferences) {
                this.state.preferences = { ...this.state.preferences, ...JSON.parse(savedPreferences) };
            }

            // Load user data
            const savedData = localStorage.getItem('dashboardData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.state.user = { ...this.state.user, ...data.user };
                this.state.stats = { ...this.state.stats, ...data.stats };
                this.state.tasks = data.tasks || [];
                this.state.earnings = { ...this.state.earnings, ...data.earnings };
                this.state.challenges = data.challenges || [];
                this.state.skills = data.skills || [];
            }

            // Load activities
            const savedActivities = localStorage.getItem('dashboardActivities');
            if (savedActivities) {
                this.state.activities = JSON.parse(savedActivities);
            }

            this.emit('dataLoaded', this.state);
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            this.emit('loadError', error);
        }
    }

    setupAutoSave() {
        // Auto-save every 30 seconds if there are unsaved changes
        setInterval(() => {
            if (this.state.session.unsavedChanges) {
                this.saveToStorage();
                this.state.session.unsavedChanges = false;
            }
        }, 30000);
    }

    // Clear all data (for logout or reset)
    clearData() {
        localStorage.removeItem('dashboardPreferences');
        localStorage.removeItem('dashboardData');
        localStorage.removeItem('dashboardActivities');

        // Reset state to defaults
        this.state = {
            user: { id: null, firstName: '', lastName: '', email: '', bio: '', location: '', timezone: 'PST', avatar: '', tier: 'bronze', joinDate: null, lastActive: null },
            stats: { totalEarnings: 0, activeTasks: 0, completionRate: 0, globalRank: 0, monthlyEarnings: 0, weeklyEarnings: 0 },
            tasks: [],
            earnings: { transactions: [], revenueBreakdown: { challenges: 0, projects: 0, bonuses: 0 }, tierProgress: { currentTier: 'bronze', currentPoints: 0, nextTier: 'silver', pointsToNext: 250, totalPoints: 250 } },
            challenges: [],
            activities: [],
            skills: [],
            preferences: { theme: 'light', language: 'en', notifications: true, emailNotifications: true, viewMode: 'grid', chartPeriod: 30 },
            session: { lastSync: null, unsavedChanges: false, activeTab: 'dashboard', sidebarCollapsed: false }
        };

        this.emit('dataCleared');
    }

    // Mock data for demonstration
    loadMockData() {
        // Only load mock data if no real data exists
        if (!this.state.user.id) {
            this.state.user = {
                id: 'user123',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                bio: 'Passionate full-stack developer with 5+ years of experience in React, Node.js, and modern web technologies. Contributor to various open-source projects.',
                location: 'San Francisco, CA',
                timezone: 'PST',
                avatar: 'https://via.placeholder.com/120x120/2563eb/white?text=JD',
                tier: 'gold',
                joinDate: '2024-01-15T00:00:00Z',
                lastActive: new Date().toISOString()
            };

            this.state.stats = {
                totalEarnings: 2847,
                activeTasks: 23,
                completionRate: 94,
                globalRank: 47,
                monthlyEarnings: 485,
                weeklyEarnings: 125
            };

            this.state.skills = [
                { id: '1', name: 'JavaScript', level: 5, verified: true, addedAt: '2024-01-20T00:00:00Z' },
                { id: '2', name: 'React', level: 4, verified: true, addedAt: '2024-01-20T00:00:00Z' },
                { id: '3', name: 'Node.js', level: 4, verified: false, addedAt: '2024-01-25T00:00:00Z' },
                { id: '4', name: 'Python', level: 3, verified: true, addedAt: '2024-02-01T00:00:00Z' },
                { id: '5', name: 'Trading Strategy', level: 2, verified: false, addedAt: '2024-02-15T00:00:00Z' },
                { id: '6', name: 'UI/UX Design', level: 3, verified: false, addedAt: '2024-03-01T00:00:00Z' }
            ];

            // Mock tasks
            this.state.tasks = [
                {
                    id: 'task1',
                    title: 'Implement user authentication system',
                    description: 'Create JWT-based authentication with refresh tokens',
                    status: 'in-progress',
                    priority: 'high',
                    dueDate: '2024-12-20T00:00:00Z',
                    project: 'Project Connect Core',
                    assignedTo: 'user123',
                    estimatedHours: 16,
                    actualHours: 8,
                    tags: ['backend', 'authentication', 'security'],
                    createdAt: '2024-12-01T00:00:00Z',
                    updatedAt: '2024-12-15T00:00:00Z'
                },
                {
                    id: 'task2',
                    title: 'Design dashboard wireframes',
                    description: 'Create comprehensive wireframes for the user dashboard',
                    status: 'completed',
                    priority: 'medium',
                    dueDate: '2024-12-10T00:00:00Z',
                    project: 'Dashboard UI',
                    assignedTo: 'user123',
                    estimatedHours: 8,
                    actualHours: 6,
                    tags: ['design', 'wireframes', 'ui'],
                    createdAt: '2024-11-25T00:00:00Z',
                    updatedAt: '2024-12-08T00:00:00Z'
                },
                {
                    id: 'task3',
                    title: 'Optimize database queries',
                    description: 'Improve performance of user analytics queries',
                    status: 'pending',
                    priority: 'medium',
                    dueDate: '2024-12-25T00:00:00Z',
                    project: 'Performance Optimization',
                    assignedTo: 'user123',
                    estimatedHours: 12,
                    actualHours: 0,
                    tags: ['database', 'optimization', 'backend'],
                    createdAt: '2024-12-10T00:00:00Z',
                    updatedAt: '2024-12-10T00:00:00Z'
                }
            ];

            // Mock transactions
            this.state.earnings.transactions = [
                {
                    id: 'tx1',
                    date: '2024-12-15T00:00:00Z',
                    description: 'Challenge Completion: Consistency Master',
                    type: 'challenge',
                    amount: 150,
                    status: 'completed'
                },
                {
                    id: 'tx2',
                    date: '2024-12-10T00:00:00Z',
                    description: 'Project Revenue Share: Dashboard Development',
                    type: 'project',
                    amount: 200,
                    status: 'completed'
                },
                {
                    id: 'tx3',
                    date: '2024-12-05T00:00:00Z',
                    description: 'Monthly Top Contributor Bonus',
                    type: 'bonus',
                    amount: 100,
                    status: 'processing'
                },
                {
                    id: 'tx4',
                    date: '2024-11-30T00:00:00Z',
                    description: 'Challenge Completion: Risk Management Pro',
                    type: 'challenge',
                    amount: 300,
                    status: 'completed'
                },
                {
                    id: 'tx5',
                    date: '2024-11-25T00:00:00Z',
                    description: 'Project Revenue Share: API Development',
                    type: 'project',
                    amount: 250,
                    status: 'completed'
                }
            ];

            this.state.earnings.revenueBreakdown = {
                challenges: 1285,
                projects: 998,
                bonuses: 564
            };

            this.state.earnings.tierProgress = {
                currentTier: 'gold',
                currentPoints: 750,
                nextTier: 'platinum',
                pointsToNext: 250,
                totalPoints: 1000
            };

            // Mock challenges
            this.state.challenges = [
                {
                    id: 'challenge1',
                    title: 'Consistency Master',
                    description: 'Complete daily tasks for 30 consecutive days',
                    type: 'consistency',
                    status: 'active',
                    progress: 75,
                    reward: 500,
                    deadline: '2024-12-31T00:00:00Z',
                    participants: 45,
                    joinedAt: '2024-12-01T00:00:00Z'
                },
                {
                    id: 'challenge2',
                    title: 'Innovation Sprint',
                    description: 'Propose and implement a new feature',
                    type: 'innovation',
                    status: 'completed',
                    progress: 100,
                    reward: 1000,
                    deadline: '2024-11-30T00:00:00Z',
                    participants: 23,
                    joinedAt: '2024-11-01T00:00:00Z'
                }
            ];

            // Mock recent activities
            this.state.activities = [
                {
                    id: 'activity1',
                    type: 'task_completed',
                    description: 'Completed task: Design dashboard wireframes',
                    timestamp: '2024-12-15T10:30:00Z',
                    relatedId: 'task2'
                },
                {
                    id: 'activity2',
                    type: 'earnings_received',
                    description: 'Received $150 from Consistency Master challenge',
                    timestamp: '2024-12-15T09:15:00Z',
                    relatedId: 'tx1'
                },
                {
                    id: 'activity3',
                    type: 'skill_added',
                    description: 'Added new skill: Trading Strategy',
                    timestamp: '2024-12-14T16:45:00Z',
                    relatedId: '5'
                },
                {
                    id: 'activity4',
                    type: 'challenge_joined',
                    description: 'Joined Innovation Sprint challenge',
                    timestamp: '2024-12-12T14:20:00Z',
                    relatedId: 'challenge2'
                },
                {
                    id: 'activity5',
                    type: 'task_started',
                    description: 'Started working on authentication system',
                    timestamp: '2024-12-11T11:00:00Z',
                    relatedId: 'task1'
                }
            ];
        }
    }

    // Utility methods
    getTasksByStatus(status) {
        return this.state.tasks.filter(task => task.status === status);
    }

    getTransactionsByType(type) {
        return this.state.earnings.transactions.filter(tx => tx.type === type);
    }

    getRecentActivities(limit = 10) {
        return this.state.activities.slice(0, limit);
    }

    getActiveChallenges() {
        return this.state.challenges.filter(challenge => challenge.status === 'active');
    }

    getVerifiedSkills() {
        return this.state.skills.filter(skill => skill.verified);
    }

    // Analytics helpers
    getEarningsTrend(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.state.earnings.transactions
            .filter(tx => new Date(tx.date) >= cutoffDate && tx.status === 'completed')
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    getTaskCompletionRate(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentTasks = this.state.tasks.filter(task =>
            new Date(task.createdAt) >= cutoffDate
        );

        if (recentTasks.length === 0) return 0;

        const completedTasks = recentTasks.filter(task => task.status === 'completed');
        return (completedTasks.length / recentTasks.length) * 100;
    }
}

// Create global state instance
window.dashboardState = new DashboardState();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardState;
}