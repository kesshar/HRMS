const express = require('express');
const router = express.Router();
const {
  createMeeting,
  getMyMeetings,
  getAllMeetings,
  getMeetingDetails,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  endMeeting,
  joinMeeting,
  admitParticipant,
  getActiveSessions,
  // Jitsi
  createJitsiMeeting,
  getActiveJitsiMeeting,
  endJitsiMeeting
} = require('../controllers/meetingController');
const { protect, protectEmployee, protectAdmin, adminOnly } = require('../middleware/authMiddleware');

// Protect all routes
router.use(protect);

// ── Jitsi Meet instant-meeting routes (MUST be before /:meetingId catch-all) ──
router.post('/jitsi/create', adminOnly, (req, res) => createJitsiMeeting(req, res));
router.get('/jitsi/active', (req, res) => getActiveJitsiMeeting(req, res));
router.post('/jitsi/end', adminOnly, (req, res) => endJitsiMeeting(req, res));

// Scheduled meeting routes
router.post('/', (req, res) => createMeeting(req, res));
router.get('/my-meetings', (req, res) => getMyMeetings(req, res));
router.get('/all', adminOnly, (req, res) => getAllMeetings(req, res));
router.get('/active/:meetingId', (req, res) => getActiveSessions(req, res));

// Meeting operations (keep after /jitsi/* and /all so they don't catch those paths)
router.get('/:meetingId', (req, res) => getMeetingDetails(req, res));
router.put('/:meetingId', (req, res) => updateMeeting(req, res));
router.delete('/:meetingId', (req, res) => deleteMeeting(req, res));
router.post('/:meetingId/start', (req, res) => startMeeting(req, res));
router.post('/:meetingId/end', (req, res) => endMeeting(req, res));
router.post('/:meetingId/join', (req, res) => joinMeeting(req, res));
router.post('/:meetingId/admit', (req, res) => admitParticipant(req, res));

module.exports = router;
