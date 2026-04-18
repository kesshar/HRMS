const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  getLeavePolicy,
  setLeavePolicy,
  getAllLeaves,
  updateLeaveStatus,
  getLeaveSummary,
  applyLeave
} = require("../controllers/leaveController");

// Admin Routes
router.get("/policy", protect, adminOnly, getLeavePolicy);
router.post("/policy", protect, adminOnly, setLeavePolicy);
router.get("/all", protect, adminOnly, getAllLeaves);
router.patch("/:id/status", protect, adminOnly, updateLeaveStatus);

// Employee Routes (Technically any authenticated user can act as an employee)
router.get("/summary", protect, getLeaveSummary);
router.post("/apply", protect, applyLeave);

module.exports = router;
