const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization1',
        required: true
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    metrics: {
        attendanceScore: {
            type: Number,
            default: 0
        },
        taskCompletionScore: {
            type: Number,
            default: 0
        },
        totalScore: {
            type: Number,
            default: 0
        },
        rank: {
            type: Number,
            default: 0
        },
        previousRank: {
            type: Number,
            default: 0
        }
    },
    breakdown: {
        totalDays: {
            type: Number,
            default: 0
        },
        presentDays: {
            type: Number,
            default: 0
        },
        lateDays: {
            type: Number,
            default: 0
        },
        totalTasks: {
            type: Number,
            default: 0
        },
        completedTasks: {
            type: Number,
            default: 0
        },
        overdueTasks: {
            type: Number,
            default: 0
        }
    },
    achievements: [{
        type: {
            type: String,
            enum: ['perfect_attendance', 'task_master', 'early_bird', 'overtime_hero', 'consistent_performer']
        },
        date: Date,
        points: Number
    }],
    rewards: [{
        type: String,
        description: String,
        points: Number,
        date: Date
    }]
}, {
    timestamps: true
});

leaderboardSchema.index({ organization: 1, period: 1, endDate: -1 });
leaderboardSchema.index({ organization: 1, employee: 1, period: 1 });
leaderboardSchema.index({ organization: 1, period: 1, 'metrics.totalScore': -1 });

leaderboardSchema.pre('save', function(next) {
    this.metrics.totalScore = this.metrics.attendanceScore + this.metrics.taskCompletionScore;
    next();
});

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
