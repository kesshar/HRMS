const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
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
    month: { type: Number, required: true }, // e.g., 1 for January
    year: { type: Number, required: true },  // e.g., 2024
    
    // Captured constants
    basic: { type: Number, required: true },
    hra: { type: Number, required: true },
    allowances: { type: Number, required: true },
    grossSalary: { type: Number, required: true },
    
    // Activity metrics
    workingDays: { type: Number, required: true },
    presentDays: { type: Number, required: true },
    LWP_days: { type: Number, required: true },
    
    // Deductions & Net
    tax: { type: Number, required: true },
    pf: { type: Number, required: true },
    LWP_deduction: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    
    status: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate payrolls for the same employee in the same month/year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("Payroll", payrollSchema);
