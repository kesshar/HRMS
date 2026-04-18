const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization1',
        required: true
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['misconduct', 'harassment', 'performance', 'attendance', 'policy_violation', 'other']
    },
    description: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['pending', 'under_review', 'resolved', 'dismissed'],
        default: 'pending'
    },
    evidence: [{
        evidenceType: String,
        url: String
    }],
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    reviewNotes: String,
    resolution: String,
    resolutionDate: Date,
    anonymous: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

reportSchema.index({ organization: 1, status: 1 });
reportSchema.index({ reportedUser: 1, status: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
