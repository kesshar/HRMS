const mongoose = require("mongoose");

const performanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    
    // Core Scores
    attendanceScore: { type: Number, default: 0 },
    taskScore: { type: Number, default: 0 },
    leaveScore: { type: Number, default: 0 },
    hrRating: { type: Number, default: 3 }, // 1-5 scale, default 3
    finalScore: { type: Number, default: 0 },
    
    // Stored Analytics Breakdown
    breakdown: {
      presentDays: { type: Number, default: 0 },
      workingDays: { type: Number, default: 30 },
      totalTasks: { type: Number, default: 0 },
      completedTasks: { type: Number, default: 0 },
      tasksBeforeDeadline: { type: Number, default: 0 },
      missedDeadlines: { type: Number, default: 0 },
      totalLeaves: { type: Number, default: 0 },
      lwpLeaves: { type: Number, default: 0 }
    },
    
    // Explanations
    bonusesApplied: [String],
    penaltiesApplied: [String],
  },
  { timestamps: true }
);

// One score per month per employee
performanceSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Performance", performanceSchema);
