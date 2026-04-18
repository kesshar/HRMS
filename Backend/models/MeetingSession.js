const mongoose = require('mongoose');

const meetingSessionSchema = new mongoose.Schema({
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  socketId: {
    type: String,
    required: true
  },
  peerId: {
    type: String,
    required: true
  },
  mediaState: {
    audio: {
      enabled: { type: Boolean, default: true },
      deviceId: String,
      muted: { type: Boolean, default: false }
    },
    video: {
      enabled: { type: Boolean, default: true },
      deviceId: String,
      off: { type: Boolean, default: false }
    },
    screen: {
      sharing: { type: Boolean, default: false },
      streamId: String
    }
  },
  connectionState: {
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    },
    bandwidth: {
      upload: Number,
      download: Number
    },
    latency: Number,
    packetLoss: Number
  },
  permissions: {
    canSpeak: { type: Boolean, default: true },
    canVideo: { type: Boolean, default: true },
    canShare: { type: Boolean, default: false },
    canRecord: { type: Boolean, default: false },
    canMuteOthers: { type: Boolean, default: false },
    canRemoveParticipants: { type: Boolean, default: false }
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['host', 'moderator', 'participant'],
    default: 'participant'
  },
  raisedHand: {
    isRaised: { type: Boolean, default: false },
    raisedAt: Date
  },
  reactions: [{
    emoji: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

meetingSessionSchema.index({ meeting: 1, isActive: 1 });
meetingSessionSchema.index({ user: 1, isActive: 1 });
meetingSessionSchema.index({ socketId: 1 });

module.exports = mongoose.model('MeetingSession', meetingSessionSchema);
