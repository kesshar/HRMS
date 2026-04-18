const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  setSalaryStructure,
  getSalaryStructures,
  generatePayroll,
  getAllPayrolls,
  markPaid,
  getMyPayrolls
} = require("../controllers/payrollController");

// Admin Routes
router.post("/structure", protect, adminOnly, setSalaryStructure);
router.get("/structure", protect, adminOnly, getSalaryStructures);
router.post("/generate", protect, adminOnly, generatePayroll);
router.get("/all", protect, adminOnly, getAllPayrolls);
router.patch("/:id/mark-paid", protect, adminOnly, markPaid);

// Employee Routes
router.get("/my", protect, getMyPayrolls);

module.exports = router;
