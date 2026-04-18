const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema(
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
    CL_total: { type: Number, default: 0 },
    CL_used: { type: Number, default: 0 },
    SL_total: { type: Number, default: 0 },
    SL_used: { type: Number, default: 0 },
    PL_total: { type: Number, default: 0 },
    PL_used: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
