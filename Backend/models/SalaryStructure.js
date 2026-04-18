const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema(
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
      unique: true,
    },
    basic: {
      type: Number,
      required: true,
    },
    hra: {
      type: Number,
      required: true,
    },
    allowances: {
      type: Number,
      default: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
    },
    pf: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SalaryStructure", salaryStructureSchema);
