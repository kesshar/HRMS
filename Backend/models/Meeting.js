const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization1',
    required: true
  },
  // ── Jitsi Meet fields (optional – only set for instant Jitsi meetings) ──
  jitsiRoomId:   { type: String },
  jitsiLink:     { type: String },
  jitsiStatus:   { type: String, enum: ['active', 'ended'], default: 'active' },
  jitsiExpiresAt: { type: Date },
  jitsiDuration: { type: Number, default: 60 },          // meeting duration in minutes
  jitsiAccessType: { type: String, enum: ['all', 'selected'], default: 'all' },
  jitsiSelectedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
    // not required – Jitsi instant meetings may not have an Employee host
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    joinedAt: Date,
    leftAt: Date,
    role: {
      type: String,
      enum: ['host', 'moderator', 'participant'],
      default: 'participant'
    },
    permissions: {
      canSpeak: { type: Boolean, default: true },
      canVideo: { type: Boolean, default: true },
      canShare: { type: Boolean, default: false },
      canRecord: { type: Boolean, default: false }
    },
    isMuted: { type: Boolean, default: false },
    isVideoOff: { type: Boolean, default: false }
  }],
  scheduledStartTime: {
    type: Date,
    required: true
  },
  scheduledEndTime: {
    type: Date,
    required: true
  },
  actualStartTime: Date,
  actualEndTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'started', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  meetingType: {
    type: String,
    enum: ['instant', 'scheduled', 'recurring'],
    default: 'scheduled'
  },
  privacy: {
    type: String,
    enum: ['public', 'private', 'password_protected'],
    default: 'private'
  },
  password: String,
  waitingRoom: {
    enabled: { type: Boolean, default: true },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      joinedAt: Date,
      admittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    }]
  },
  settings: {
    allowRecording: { type: Boolean, default: false },
    autoRecording: { type: Boolean, default: false },
    allowScreenShare: { type: Boolean, default: true },
    allowChat: { type: Boolean, default: true },
      allowRaiseHand: { type: Boolean, default: true },
      allowBreakoutRooms: { type: Boolean, default: false },
      maxParticipants: { type: Number, default: 50 },
      joinBeforeHost: { type: Boolean, default: false }
  },
  recording: {
    isRecording: { type: Boolean, default: false },
    recordingUrl: String,
    recordingStartedAt: Date,
    recordingEndedAt: Date,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  breakoutRooms: [{
    id: String,
    name: String,
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }],
    createdAt: Date
  }],
  chat: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text'
    }
  }],
  polls: [{
    question: String,
    options: [String],
    votes: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      },
      option: Number,
      votedAt: { type: Date, default: Date.now }
    }],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    emoji: String,
    timestamp: { type: Date, default: Date.now }
  }],
  sharedScreen: {
    isActive: { type: Boolean, default: false },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    startedAt: Date
  }
}, {
  timestamps: true
});

meetingSchema.index({ organization: 1, status: 1 });
meetingSchema.index({ host: 1, scheduledStartTime: -1 });
meetingSchema.index({ 'participants.user': 1, scheduledStartTime: -1 });
meetingSchema.index({ scheduledStartTime: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);
