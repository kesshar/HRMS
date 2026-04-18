const express = require('express');
const router = express.Router();
const {
  calculateLeaderboardScores,
  getLeaderboard,
  getMyLeaderboardPosition,
  getLeaderboardHistory,
  awardReward
} = require('../controllers/leaderboardController');
const { protectEmployee, protectAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protectEmployee);

// Get leaderboard
router.get('/', getLeaderboard);

// Get my leaderboard position
router.get('/my-position', getMyLeaderboardPosition);

// Get leaderboard history for an employee
router.get('/history/:employeeId', getLeaderboardHistory);

// Admin only routes
router.post('/calculate', protectAdmin, calculateLeaderboardScores);
router.post('/award-reward', protectAdmin, awardReward);

module.exports = router;
