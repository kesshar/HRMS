const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");

const {
  generateLeaderboard,
  getLeaderboard,
  updateHRRating,
  getMyPerformance
} = require("../controllers/performanceController");

// Accessible anywhere in the system
router.get("/leaderboard", protect, getLeaderboard);
router.get("/my", protect, getMyPerformance);

// Admin restricted compute engines
router.post("/generate", protect, adminOnly, generateLeaderboard);
router.patch("/rating", protect, adminOnly, updateHRRating);

module.exports = router;
