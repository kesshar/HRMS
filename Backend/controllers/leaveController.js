const LeaveBalance = require("../models/LeaveBalance");
const LeavePolicy = require("../models/LeavePolicy");
const LeaveRequest = require("../models/LeaveRequest");
const Employee = require("../models/Employee");

// ==========================================
// ADMIN/HR CONTROLLERS
// ==========================================

// Get the master Leave Policy
const getLeavePolicy = async (req, res) => {
  try {
    const policy = await LeavePolicy.findOne({ organizationId: req.organizationId });
    if (!policy) {
      // return default structure if untracked but conceptually 10/5/15
      return res.status(200).json({ default_CL: 0, default_SL: 0, default_PL: 0 });
    }
    res.status(200).json(policy);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Set Policy and Backfill Balances
const setLeavePolicy = async (req, res) => {
  try {
    const { default_CL, default_SL, default_PL } = req.body;
    let policy = await LeavePolicy.findOne({ organizationId: req.organizationId });

    if (policy) {
      policy.default_CL = default_CL;
      policy.default_SL = default_SL;
      policy.default_PL = default_PL;
      await policy.save();
    } else {
      policy = await LeavePolicy.create({
        organizationId: req.organizationId,
        default_CL,
        default_SL,
        default_PL
      });
    }

    // Now Backfill ALL employees in this organization to have these new totals
    const employees = await Employee.find({ organizationId: req.organizationId });
    for (let emp of employees) {
      let balance = await LeaveBalance.findOne({ employeeId: emp._id });
      if (balance) {
        balance.CL_total = default_CL;
        balance.SL_total = default_SL;
        balance.PL_total = default_PL;
        await balance.save();
      } else {
        await LeaveBalance.create({
          organizationId: req.organizationId,
          employeeId: emp._id,
          CL_total: default_CL,
          SL_total: default_SL,
          PL_total: default_PL,
          CL_used: 0, SL_used: 0, PL_used: 0
        });
      }
    }

    res.status(200).json({ message: "Policy updated and all user balances recalculated.", policy });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Leaves for HR
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ organizationId: req.organizationId })
      .populate("employeeId", "name email department")
      .sort({ createdAt: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Approve or Reject Leave Request Manually
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, hrRemarks } = req.body;

    const leaveReq = await LeaveRequest.findById(id);
    if (!leaveReq) return res.status(404).json({ message: "Leave request not found" });

    // Important: We only subtract balances IF it wasn't already approved, and we only reverse IF it was approved
    if (status === "Approved" && leaveReq.status !== "Approved") {
      if (leaveReq.leaveType !== "LWP") {
        const balance = await LeaveBalance.findOne({ employeeId: leaveReq.employeeId });
        if (balance) {
          balance[`${leaveReq.leaveType}_used`] += leaveReq.totalDays;
          await balance.save();
        }
      }
      leaveReq.status = "Approved";
    } else if (status === "Rejected" && leaveReq.status === "Approved") {
      // Admin is rejecting an already approved leave, we must refund!
      if (leaveReq.leaveType !== "LWP") {
        const balance = await LeaveBalance.findOne({ employeeId: leaveReq.employeeId });
        if (balance) {
          balance[`${leaveReq.leaveType}_used`] = Math.max(0, balance[`${leaveReq.leaveType}_used`] - leaveReq.totalDays);
          await balance.save();
        }
      }
      leaveReq.status = "Rejected";
    } else {
      leaveReq.status = status; // Typically going from Pending to Rejected
    }

    if (hrRemarks !== undefined) {
      leaveReq.hrRemarks = hrRemarks;
    }

    await leaveReq.save();
    res.status(200).json(leaveReq);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================================
// EMPLOYEE CONTROLLERS
// ==========================================

// Helper function to lazily initialize a balance if HR hasn't yet, or if it's a new employee
const _getOrCreateBalance = async (employeeId, organizationId) => {
  let balance = await LeaveBalance.findOne({ employeeId });
  if (!balance) {
    const policy = await LeavePolicy.findOne({ organizationId });
    balance = await LeaveBalance.create({
      organizationId,
      employeeId,
      CL_total: policy?.default_CL || 0,
      SL_total: policy?.default_SL || 0,
      PL_total: policy?.default_PL || 0,
    });
  }
  return balance;
};

// Get Dashboard Leaves Summary & History
const getLeaveSummary = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    const balance = await _getOrCreateBalance(employeeId, organizationId);
    const requests = await LeaveRequest.find({ employeeId }).sort({ createdAt: -1 });

    const totalTaken = balance.CL_used + balance.SL_used + balance.PL_used;
    const pendingCount = requests.filter(r => r.status === "Pending").length;

    res.status(200).json({
      balance,
      history: requests,
      summary: {
        totalTaken,
        pendingCount,
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Apply for Leave
const applyLeave = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const organizationId = req.organizationId;
    const { leaveType, fromDate, toDate, reason } = req.body;

    const start = new Date(fromDate);
    const end = new Date(toDate);
    const diffTime = Math.abs(end - start);
    // Inclusive days
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let finalStatus = "Pending";
    let hrRemarks = "";

    // Perform auto-rejection limit checks via Balance
    if (leaveType !== "LWP") {
      const balance = await _getOrCreateBalance(employeeId, organizationId);
      const limit = balance[`${leaveType}_total`];
      const used = balance[`${leaveType}_used`];
      const remaining = limit - used;

      if (totalDays > remaining) {
        finalStatus = "Rejected";
        hrRemarks = "Auto-Rejected: Insufficient leave balance.";
      }
    }

    const leaveReq = await LeaveRequest.create({
      organizationId,
      employeeId,
      leaveType,
      fromDate,
      toDate,
      totalDays,
      status: finalStatus,
      reason,
      hrRemarks
    });

    res.status(201).json(leaveReq);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getLeavePolicy,
  setLeavePolicy,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveSummary,
  applyLeave
};
