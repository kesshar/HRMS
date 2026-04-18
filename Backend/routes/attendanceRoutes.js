const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  getCurrentTimerStatus,
  startAttendanceTimer,
  addManualAttendance,
  getAttendanceStats,
  getAttendanceByDate,
  getAttendanceByEmployee
} = require('../controllers/attendanceController');
const { protectEmployee, protectAdmin } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protectEmployee);

// ── Existing check-in / check-out ──────────────────────────────
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);

// ── Existing attendance queries ────────────────────────────────
router.get('/today', getTodayAttendance);
router.get('/my-attendance', getMyAttendance);
router.get('/timer/status', getCurrentTimerStatus);

// ── Admin only – existing ──────────────────────────────────────
router.get('/all', protectAdmin, getAllAttendance);
router.post('/manual', protectAdmin, addManualAttendance);
router.get('/stats', protectAdmin, getAttendanceStats);
router.post('/timer/start', protectAdmin, startAttendanceTimer);

router.get('/date/:date', protectAdmin, getAttendanceByDate);
router.get('/employee/:id', protectAdmin, getAttendanceByEmployee);




module.exports = router;
