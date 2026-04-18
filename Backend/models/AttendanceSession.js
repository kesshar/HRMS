const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization1',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Index for fast lookup by organization
attendanceSessionSchema.index({ organization: 1, isActive: 1 });
// TTL index – MongoDB auto-deletes expired docs after 70 seconds
attendanceSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 70 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
