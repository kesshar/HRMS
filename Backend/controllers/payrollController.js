const Payroll = require("../models/Payroll");
const SalaryStructure = require("../models/SalaryStructure");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");

// =======================
// HR CONTROLLERS
// =======================

const setSalaryStructure = async (req, res) => {
  try {
    const { employeeId, basic, hra, allowances, taxPercent, pf } = req.body;
    
    let structure = await SalaryStructure.findOne({ employeeId, organizationId: req.organizationId });
    if (structure) {
      structure.basic = basic;
      structure.hra = hra;
      structure.allowances = allowances;
      structure.taxPercent = taxPercent;
      structure.pf = pf;
      await structure.save();
    } else {
      structure = await SalaryStructure.create({
        organizationId: req.organizationId,
        employeeId,
        basic,
        hra,
        allowances,
        taxPercent,
        pf
      });
    }

    res.status(200).json(structure);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSalaryStructures = async (req, res) => {
  try {
    const structures = await SalaryStructure.find({ organizationId: req.organizationId }).populate("employeeId", "name email department");
    res.status(200).json(structures);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const generatePayroll = async (req, res) => {
  try {
    const { month, year, workingDaysConfig = 30 } = req.body;
    const organizationId = req.organizationId;

    // Month is 1-12. Need date ranges for queries.
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    const structures = await SalaryStructure.find({ organizationId });
    if (structures.length === 0) {
      return res.status(400).json({ message: "No salary structures defined. Assign structures first." });
    }

    const generated = [];
    const errors = [];

    for (let struct of structures) {
      const existing = await Payroll.findOne({ employeeId: struct.employeeId, month, year });
      if (existing) {
        errors.push({ employeeId: struct.employeeId, message: "Already generated" });
        continue;
      }

      // 1. Calculate Attendance
      const attendanceRecords = await Attendance.find({
        employee: struct.employeeId,
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['present', 'late', 'half_day'] } // Considering these as contributing to presentDays config 
      });
      // A half day might be 0.5, but let's just count documents for simplicity or add logic
      let presentDays = 0;
      attendanceRecords.forEach(r => {
        if (r.status === 'half_day') presentDays += 0.5;
        else presentDays += 1;
      });

      // 2. Calculate LWP from Leaves
      // Find leaves that intersect this month and are LWP and Approved
      const leaves = await LeaveRequest.find({
        employeeId: struct.employeeId,
        leaveType: "LWP",
        status: "Approved",
        fromDate: { $lte: endDate },
        toDate: { $gte: startDate }
      });

      let LWP_days = 0;
      leaves.forEach(lv => {
        // Find intersection of leave range and month range
        const lStart = Math.max(new Date(lv.fromDate).getTime(), startDate.getTime());
        const lEnd = Math.min(new Date(lv.toDate).getTime(), endDate.getTime());
        if (lStart <= lEnd) {
          const diffTime = Math.abs(lEnd - lStart);
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          LWP_days += days;
        }
      });

      // 3. Mathematics
      const grossSalary = struct.basic + struct.hra + struct.allowances;
      const perDaySalary = grossSalary / workingDaysConfig;
      
      const LWP_deduction = perDaySalary * LWP_days;
      const tax = (grossSalary * struct.taxPercent) / 100;
      const pf = struct.pf;

      const totalDeductions = tax + pf + LWP_deduction;
      // ensure we don't drop below 0
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      // 4. Save
      const payroll = await Payroll.create({
        organizationId,
        employeeId: struct.employeeId,
        month,
        year,
        basic: struct.basic,
        hra: struct.hra,
        allowances: struct.allowances,
        grossSalary,
        workingDays: workingDaysConfig,
        presentDays,
        LWP_days,
        tax,
        pf,
        LWP_deduction,
        totalDeductions,
        netSalary,
        status: "Pending"
      });

      generated.push(payroll);
    }

    res.status(200).json({ 
      message: `Generated ${generated.length} payrolls. Skipped ${errors.length}.`,
      generated,
      errors
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ organizationId: req.organizationId })
      .populate("employeeId", "name email department")
      .sort({ year: -1, month: -1 });
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const markPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const payroll = await Payroll.findById(id);
    if (!payroll) return res.status(404).json({ message: "Not found" });
    
    payroll.status = "Paid";
    await payroll.save();
    res.status(200).json(payroll);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// EMPLOYEE CONTROLLERS
// =======================
const getMyPayrolls = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employeeId: req.user.id })
                   .populate("employeeId", "name email designation") // in case we need info for pdf
                   .sort({ year: -1, month: -1 });
    res.status(200).json(payrolls);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {
  setSalaryStructure,
  getSalaryStructures,
  generatePayroll,
  getAllPayrolls,
  markPaid,
  getMyPayrolls
};
