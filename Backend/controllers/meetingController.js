const Meeting = require('../models/Meeting');
const MeetingSession = require('../models/MeetingSession');
const Employee = require('../models/Employee');
const crypto = require('crypto');

// Create a new meeting
const createMeeting = async (req, res) => {
  try {
    const {
      title,
      description,
      scheduledStartTime,
      scheduledEndTime,
      participants,
      meetingType = 'scheduled',
      privacy = 'private',
      password,
      settings
    } = req.body;

    const hostId = req.user.id;
    const organizationId = req.organizationId;

    if (!title || !scheduledStartTime || !scheduledEndTime) {
      return res.status(400).json({ 
        message: 'Title, start time, and end time are required' 
      });
    }

    // Verify participants belong to the same organization
    if (participants && participants.length > 0) {
      const validParticipants = await Employee.find({
        _id: { $in: participants },
        organizationId: organizationId
      });

      if (validParticipants.length !== participants.length) {
        return res.status(400).json({ 
          message: 'Some participants are not valid or not in your organization' 
        });
      }
    }

    const meetingData = {
      organization: organizationId,
      title,
      description,
      host: hostId,
      scheduledStartTime: new Date(scheduledStartTime),
      scheduledEndTime: new Date(scheduledEndTime),
      meetingType,
      privacy,
      settings: {
        allowRecording: false,
        autoRecording: false,
        allowScreenShare: true,
        allowChat: true,
        allowRaiseHand: true,
        allowBreakoutRooms: false,
        maxParticipants: 50,
        joinBeforeHost: false,
        ...settings
      }
    };

    if (privacy === 'password_protected' && password) {
      meetingData.password = password;
    }

    if (participants && participants.length > 0) {
      meetingData.participants = participants.map(userId => ({
        user: userId,
        role: 'participant'
      }));
    }

    const meeting = new Meeting(meetingData);
    await meeting.save();

    const populatedMeeting = await Meeting.findById(meeting._id)
      .populate('host', 'name email profileImage')
      .populate('participants.user', 'name email profileImage');

    res.status(201).json(populatedMeeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all meetings for the user
const getMyMeetings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    const filter = { 
      organization: organizationId,
      $or: [
        { host: userId },
        { 'participants.user': userId }
      ]
    };

    if (status) {
      filter.status = status;
    }

    const meetings = await Meeting.find(filter)
      .populate('host', 'name email profileImage')
      .populate('participants.user', 'name email profileImage')
      .sort({ scheduledStartTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Meeting.countDocuments(filter);

    res.status(200).json({
      meetings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all meetings (admin)
const getAllMeetings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const organizationId = req.organizationId;

    const filter = { organization: organizationId };
    if (status) {
      filter.status = status;
    }

    const meetings = await Meeting.find(filter)
      .populate('host', 'name email profileImage')
      .populate('participants.user', 'name email profileImage')
      .sort({ scheduledStartTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Meeting.countDocuments(filter);

    res.status(200).json({
      meetings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching all meetings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get meeting details
const getMeetingDetails = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    const meeting = await Meeting.findById(meetingId)
      .populate('host', 'name email profileImage')
      .populate('participants.user', 'name email profileImage')
      .populate('chat.sender', 'name profileImage');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.organization.toString() !== organizationId) {
      return res.status(403).json({ message: 'Not authorized to access this meeting' });
    }

    // Check if user is participant or host
    const isParticipant = meeting.host._id.toString() === userId || 
                         meeting.participants.some(p => p.user._id.toString() === userId);

    if (!isParticipant && meeting.privacy !== 'public') {
      return res.status(403).json({ message: 'Not authorized to access this meeting' });
    }

    res.status(200).json(meeting);
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update meeting
const updateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can update meeting
    if (meeting.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only host can update meeting' });
    }

    // Don't allow updating certain fields after meeting has started
    if (meeting.status === 'started') {
      const restrictedFields = ['scheduledStartTime', 'scheduledEndTime', 'privacy', 'password'];
      restrictedFields.forEach(field => delete updateData[field]);
    }

    Object.assign(meeting, updateData);
    await meeting.save();

    const updatedMeeting = await Meeting.findById(meetingId)
      .populate('host', 'name email profileImage')
      .populate('participants.user', 'name email profileImage');

    res.status(200).json(updatedMeeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete meeting
const deleteMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can delete meeting
    if (meeting.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only host can delete meeting' });
    }

    await Meeting.findByIdAndDelete(meetingId);

    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Start meeting
const startMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can start meeting
    if (meeting.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only host can start meeting' });
    }

    if (meeting.status !== 'scheduled') {
      return res.status(400).json({ message: 'Meeting has already been started or ended' });
    }

    meeting.status = 'started';
    meeting.actualStartTime = new Date();
    await meeting.save();

    res.status(200).json({ message: 'Meeting started successfully', meeting });
  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// End meeting
const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Only host can end meeting
    if (meeting.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only host can end meeting' });
    }

    if (meeting.status !== 'started') {
      return res.status(400).json({ message: 'Meeting is not currently active' });
    }

    meeting.status = 'ended';
    meeting.actualEndTime = new Date();
    
    // Stop recording if active
    if (meeting.recording.isRecording) {
      meeting.recording.isRecording = false;
      meeting.recording.recordingEndedAt = new Date();
    }

    await meeting.save();

    // Clean up active sessions
    await MeetingSession.updateMany(
      { meeting: meetingId, isActive: true },
      { 
        isActive: false, 
        leftAt: new Date(),
        lastActive: new Date()
      }
    );

    res.status(200).json({ message: 'Meeting ended successfully', meeting });
  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Join meeting (handle waiting room)
const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { password } = req.body;
    const userId = req.user.id;
    const organizationId = req.organizationId;

    const meeting = await Meeting.findById(meetingId)
      .populate('host', 'name email profileImage')
      .populate('participants.user', 'name email profileImage')
      .populate('waitingRoom.participants.user', 'name email profileImage');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.organization.toString() !== organizationId) {
      return res.status(403).json({ message: 'Not authorized to join this meeting' });
    }

    // Check password for password-protected meetings
    if (meeting.privacy === 'password_protected' && meeting.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check if user is already a participant
    const existingParticipant = meeting.participants.find(p => p.user._id.toString() === userId);
    const hostId = meeting.host._id.toString();

    if (existingParticipant || hostId === userId) {
      // User is already a participant or host, can join directly
      return res.status(200).json({ 
        meeting,
        canJoin: true,
        role: hostId === userId ? 'host' : 'participant'
      });
    }

    // For private meetings, check if user can join
    if (meeting.privacy === 'private' && !existingParticipant) {
      return res.status(403).json({ message: 'This is a private meeting' });
    }

    // Add to waiting room if enabled
    if (meeting.waitingRoom.enabled) {
      const alreadyInWaitingRoom = meeting.waitingRoom.participants.find(
        p => p.user._id.toString() === userId
      );

      if (!alreadyInWaitingRoom) {
        meeting.waitingRoom.participants.push({
          user: userId,
          joinedAt: new Date()
        });
        await meeting.save();
      }

      return res.status(200).json({ 
        meeting,
        canJoin: false,
        inWaitingRoom: true,
        message: 'You are in the waiting room'
      });
    }

    // Add as participant for public meetings
    meeting.participants.push({
      user: userId,
      role: 'participant'
    });
    await meeting.save();

    res.status(200).json({ 
      meeting,
      canJoin: true,
      role: 'participant'
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admit participant from waiting room
const admitParticipant = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { userId } = req.body;
    const hostId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    if (meeting.host.toString() !== hostId) {
      return res.status(403).json({ message: 'Only host can admit participants' });
    }

    // Remove from waiting room and add to participants
    const waitingRoomIndex = meeting.waitingRoom.participants.findIndex(
      p => p.user.toString() === userId
    );

    if (waitingRoomIndex === -1) {
      return res.status(404).json({ message: 'User not found in waiting room' });
    }

    const waitingParticipant = meeting.waitingRoom.participants[waitingRoomIndex];
    meeting.waitingRoom.participants.splice(waitingRoomIndex, 1);

    meeting.participants.push({
      user: userId,
      role: 'participant',
      joinedAt: new Date()
    });

    waitingParticipant.admittedBy = hostId;
    waitingParticipant.admittedAt = new Date();

    await meeting.save();

    res.status(200).json({ message: 'Participant admitted successfully' });
  } catch (error) {
    console.error('Error admitting participant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get active meeting sessions
const getActiveSessions = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findById(meetingId);

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Check if user is host or participant
    const isAuthorized = meeting.host.toString() === userId || 
                       meeting.participants.some(p => p.user.toString() === userId);

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const sessions = await MeetingSession.find({
      meeting: meetingId,
      isActive: true
    }).populate('user', 'name email profileImage');

    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ═══════════════════════════════════════════════════════
//  JITSI MEET – Instant meeting helpers
// ═══════════════════════════════════════════════════════

// POST /meetings/jitsi/create  (admin only)
const createJitsiMeeting = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization context missing' });
    }

    const {
      duration = 60,                  // minutes
      accessType = 'all',             // 'all' | 'selected'
      selectedEmployees = []          // array of employee IDs
    } = req.body;

    const durationMs = Number(duration) * 60 * 1000;
    const jitsiExpiresAt = new Date(Date.now() + durationMs);

    // Generate a unique, URL-safe room ID
    const roomId = `hrms-${organizationId.toString().slice(-6)}-${crypto.randomBytes(4).toString('hex')}`;
    const jitsiLink = `https://meet.jit.si/${roomId}`;

    // Deactivate any existing active Jitsi meeting for this org
    await Meeting.updateMany(
      { organization: organizationId, jitsiStatus: 'active' },
      { jitsiStatus: 'ended' }
    );

    // Upsert – avoids required-field issues (host etc.) on Meeting schema
    const doc = await Meeting.findOneAndUpdate(
      { organization: organizationId, jitsiRoomId: roomId },
      {
        $set: {
          organization: organizationId,
          title: `Instant Meeting – ${new Date().toLocaleTimeString()}`,
          scheduledStartTime: new Date(),
          scheduledEndTime: jitsiExpiresAt,
          status: 'started',
          meetingType: 'instant',
          privacy: accessType === 'all' ? 'public' : 'private',
          jitsiRoomId: roomId,
          jitsiLink,
          jitsiStatus: 'active',
          jitsiExpiresAt,
          jitsiDuration: Number(duration),
          jitsiAccessType: accessType,
          jitsiSelectedEmployees: accessType === 'selected' ? selectedEmployees : []
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Populate selected employees to return names to admin
    const populated = await Meeting.findById(doc._id)
      .populate('jitsiSelectedEmployees', 'name email');

    res.status(201).json({
      meetingId: doc._id,
      jitsiRoomId: roomId,
      jitsiLink,
      jitsiExpiresAt,
      jitsiDuration: Number(duration),
      jitsiAccessType: accessType,
      jitsiSelectedEmployees: populated.jitsiSelectedEmployees || []
    });
  } catch (error) {
    console.error('Error creating Jitsi meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /meetings/jitsi/active  (any authenticated user – access-controlled)
const getActiveJitsiMeeting = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const employeeId     = req.user?.id;   // employee._id (or org._id for admin)
    const now            = new Date();
    const mongoose       = require('mongoose');

    console.log('── getActiveJitsiMeeting ──');
    console.log('  employeeId     :', employeeId?.toString());
    console.log('  organizationId :', organizationId?.toString());
    console.log('  req.role       :', req.role);

    // Admin check: robustly rely on auth role instead of complex ID mapping
    const isAdmin = req.role === 'ADMIN' || organizationId?.toString() === employeeId?.toString();
    console.log('  isAdmin        :', isAdmin);

    // ── Build MongoDB query with access control baked in ──────────────────────
    // For employees: only return meetings that are either:
    //   a) accessType = 'all'
    //   b) accessType = 'selected' AND their _id is in jitsiSelectedEmployees
    // For admins: return any active meeting in the org
    let accessFilter;
    if (isAdmin) {
      accessFilter = {}; // admin sees everything
    } else {
      // Convert employeeId to ObjectId for proper $in comparison
      let empObjId;
      try { empObjId = new mongoose.Types.ObjectId(employeeId); } catch { empObjId = employeeId; }

      accessFilter = {
        $or: [
          { jitsiAccessType: 'all' },
          { jitsiAccessType: { $exists: false } },   // legacy rows have no field → treat as 'all'
          { jitsiAccessType: 'selected', jitsiSelectedEmployees: empObjId }
        ]
      };
    }

    const meeting = await Meeting.findOne({
      organization:   organizationId,
      jitsiStatus:    'active',
      jitsiExpiresAt: { $gt: now },
      ...accessFilter
    })
      .sort({ createdAt: -1 })
      .populate('jitsiSelectedEmployees', 'name email _id');

    if (!meeting) {
      console.log('  result: No accessible active meeting');
      // Return NOT_INVITED if there IS an active meeting but employee is excluded
      if (!isAdmin) {
        const anyActive = await Meeting.findOne({
          organization: organizationId,
          jitsiStatus: 'active',
          jitsiExpiresAt: { $gt: now }
        });
        if (anyActive) {
          console.log('  result: Meeting exists but employee NOT_INVITED → 403');
          return res.status(403).json({
            message: 'You are not invited to this meeting',
            code: 'NOT_INVITED'
          });
        }
      }
      return res.status(404).json({ message: 'No active meeting' });
    }

    console.log('  accessType     :', meeting.jitsiAccessType);
    console.log('  selectedEmps   :', meeting.jitsiSelectedEmployees?.map(e => e._id?.toString()));
    console.log('  result         : OK – returning meeting');

    // jitsiExpiresAt is already verified > now by the DB query above — use it directly.
    // DO NOT recompute from createdAt: upserted docs may have null createdAt
    // which would produce a 1970 expiry and immediately mark the meeting as ended.
    const expiresAt = meeting.jitsiExpiresAt;

    res.status(200).json({
      meetingId:              meeting._id,
      jitsiRoomId:            meeting.jitsiRoomId,
      jitsiLink:              meeting.jitsiLink,
      jitsiExpiresAt:         expiresAt,
      jitsiDuration:          meeting.jitsiDuration,
      jitsiAccessType:        meeting.jitsiAccessType,
      jitsiSelectedEmployees: isAdmin ? (meeting.jitsiSelectedEmployees || []) : [],
      title:                  meeting.title
    });
  } catch (error) {
    console.error('Error in getActiveJitsiMeeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// POST /meetings/jitsi/end  (admin only)
const endJitsiMeeting = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const result = await Meeting.updateMany(
      { organization: organizationId, jitsiStatus: 'active' },
      { jitsiStatus: 'ended', status: 'ended', actualEndTime: new Date() }
    );

    res.status(200).json({ message: 'Meeting ended successfully', updated: result.modifiedCount });
  } catch (error) {
    console.error('Error ending Jitsi meeting:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
