const express = require('express');
const router = express.Router();
const {
  createReport,
  getAllReports,
  getMyReports,
  getReportsAgainstMe,
  updateReportStatus,
  getReportStats
} = require('../controllers/reportController');
const { protectEmployee, protectAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protectEmployee);

// Create a new report
router.post('/', createReport);

// Get reports filed by current user
router.get('/my-reports', getMyReports);

// Get reports against current user
router.get('/against-me', getReportsAgainstMe);

// Admin only routes
router.get('/all', protectAdmin, getAllReports);
router.get('/stats', protectAdmin, getReportStats);
router.patch('/:reportId/status', protectEmployee, updateReportStatus);

module.exports = router;
