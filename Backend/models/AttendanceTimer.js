const mongoose = require('mongoose');

const attendanceTimerSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization1',
      required: true
    },
    dateKey: {
      type: String,
      required: true
    },
    startedAt: {
      type: Date,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    durationSeconds: {
      type: Number,
      required: true,
      default: 60
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { timestamps: true }
);

attendanceTimerSchema.index({ organization: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceTimer', attendanceTimerSchema);
