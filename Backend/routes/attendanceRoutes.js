const express = require('express');
const router = express.Router();
const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
  getTodayAttendance,
  addManualAttendance,
  getAttendanceStats,
  // QR Attendance
  generateQRSession,
  getActiveSession,
  markQRAttendance,
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

// ── Admin only – existing ──────────────────────────────────────
router.get('/all', protectAdmin, getAllAttendance);
router.post('/manual', protectAdmin, addManualAttendance);
router.get('/stats', protectAdmin, getAttendanceStats);

// ── QR Attendance – Admin ──────────────────────────────────────
router.post('/qr/generate', protectAdmin, generateQRSession);
router.get('/qr/active', protectAdmin, getActiveSession);
router.get('/date/:date', protectAdmin, getAttendanceByDate);
router.get('/employee/:id', protectAdmin, getAttendanceByEmployee);

// ── QR Attendance – Employee marks own attendance ──────────────
router.post('/qr/mark', markQRAttendance);

// ── QR Attendance – Employee reads current live session (for dashboard QR display) ──
router.get('/qr/current', getActiveSession);


module.exports = router;
