require('dotenv').config(); // ← MUST be first so env vars load before any require()

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const orgRoutes = require("./routes/orgRoutes");

const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const taskRoutes = require("./routes/taskRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const aiRoutes = require("./routes/aiRoutes");
const chatRoutes = require("./routes/chatRoutes");
const reportRoutes = require("./routes/reportRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const performanceRoutes = require("./routes/performanceRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

// Middleware
const { errorHandler, notFound } = require("./middleware/errorMiddleWare");

// dotenv.config() already called above – kept here for clarity

const app = express();

// Middlewares
// Configure CORS to allow the frontend (localhost for dev and deployed origin)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://zenith-hr-tpbb.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: '50mb' })); // for JSON body parsing (increased for base64 image proofs)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static folder for file uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/employee-auth", require("./routes/employeeAuthRoutes"));
app.use("/api/debug", require("./routes/debugRoutes"));
app.use("/api/org", orgRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/groups", require("./routes/groupRoutes"));
app.use("/api/leaves", require("./routes/leaveRoutes"));
app.use("/api/payroll", require("./routes/payrollRoutes"));

// Default Route
app.get("/", (req, res) => {
  res.send("Mini AI-HRMS Backend is Running...");
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://zenith-hr-tpbb.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Chat events
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on("leave-chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  socket.on("send-message", (data) => {
    io.to(data.chatId).emit("receive-message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user-typing", data);
  });

  socket.on("stop-typing", (data) => {
    socket.to(data.chatId).emit("user-stop-typing", data);
  });

  // Video Meeting events
  socket.on("join-meeting", async (data) => {
    const { meetingId, userId, peerId } = data;
    try {
      const Meeting = require('./models/Meeting');
      const MeetingSession = require('./models/MeetingSession');
      
      const meeting = await Meeting.findById(meetingId);
      if (!meeting) {
        socket.emit("meeting-error", { message: "Meeting not found" });
        return;
      }

      // Check if user is allowed to join
      const isParticipant = meeting.participants.some(p => p.user.toString() === userId) || 
                           meeting.host.toString() === userId;
      
      if (!isParticipant && meeting.privacy !== 'public') {
        socket.emit("meeting-error", { message: "Not authorized to join this meeting" });
        return;
      }

      // Join meeting room
      socket.join(`meeting-${meetingId}`);
      
      // Create or update session
      let session = await MeetingSession.findOne({
        meeting: meetingId,
        user: userId,
        isActive: true
      });

      if (!session) {
        session = new MeetingSession({
          meeting: meetingId,
          user: userId,
          socketId: socket.id,
          peerId: peerId,
          role: meeting.host.toString() === userId ? 'host' : 'participant'
        });
        await session.save();
      } else {
        session.socketId = socket.id;
        session.peerId = peerId;
        session.isActive = true;
        session.lastActive = new Date();
        await session.save();
      }

      // Notify other participants
      socket.to(`meeting-${meetingId}`).emit("participant-joined", {
        userId: userId,
        peerId: peerId,
        socketId: socket.id
      });

      // Send current participants to new joiner
      const activeSessions = await MeetingSession.find({
        meeting: meetingId,
        isActive: true,
        user: { $ne: userId }
      }).populate('user', 'name email profileImage');

      socket.emit("meeting-participants", {
        participants: activeSessions.map(s => ({
          userId: s.user._id,
          peerId: s.peerId,
          socketId: s.socketId,
          user: s.user,
          role: s.role,
          mediaState: s.mediaState
        }))
      });

    } catch (error) {
      console.error("Error joining meeting:", error);
      socket.emit("meeting-error", { message: "Failed to join meeting" });
    }
  });

  socket.on("leave-meeting", async (data) => {
    const { meetingId, userId } = data;
    const MeetingSession = require('./models/MeetingSession');
    
    try {
      await MeetingSession.updateOne(
        { meeting: meetingId, user: userId },
        { 
          isActive: false, 
          leftAt: new Date(),
          lastActive: new Date()
        }
      );

      socket.leave(`meeting-${meetingId}`);
      socket.to(`meeting-${meetingId}`).emit("participant-left", { userId });

    } catch (error) {
      console.error("Error leaving meeting:", error);
    }
  });

  // WebRTC signaling events
  socket.on("offer", (data) => {
    socket.to(data.targetSocketId).emit("offer", {
      from: socket.id,
      fromPeerId: data.fromPeerId,
      offer: data.offer
    });
  });

  socket.on("answer", (data) => {
    socket.to(data.targetSocketId).emit("answer", {
      from: socket.id,
      fromPeerId: data.fromPeerId,
      answer: data.answer
    });
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.targetSocketId).emit("ice-candidate", {
      from: socket.id,
      candidate: data.candidate
    });
  });

  // Media control events
  socket.on("toggle-audio", async (data) => {
    const { meetingId, userId, enabled } = data;
    const MeetingSession = require('./models/MeetingSession');
    
    try {
      await MeetingSession.updateOne(
        { meeting: meetingId, user: userId },
        { 
          'mediaState.audio.enabled': enabled,
          'mediaState.audio.muted': !enabled,
          lastActive: new Date()
        }
      );

      socket.to(`meeting-${meetingId}`).emit("user-audio-changed", {
        userId,
        enabled
      });
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  });

  socket.on("toggle-video", async (data) => {
    const { meetingId, userId, enabled } = data;
    const MeetingSession = require('./models/MeetingSession');
    
    try {
      await MeetingSession.updateOne(
        { meeting: meetingId, user: userId },
        { 
          'mediaState.video.enabled': enabled,
          'mediaState.video.off': !enabled,
          lastActive: new Date()
        }
      );

      socket.to(`meeting-${meetingId}`).emit("user-video-changed", {
        userId,
        enabled
      });
    } catch (error) {
      console.error("Error toggling video:", error);
    }
  });

  socket.on("start-screen-share", async (data) => {
    const { meetingId, userId } = data;
    const MeetingSession = require('./models/MeetingSession');
    
    try {
      await MeetingSession.updateOne(
        { meeting: meetingId, user: userId },
        { 
          'mediaState.screen.sharing': true,
          lastActive: new Date()
        }
      );

      socket.to(`meeting-${meetingId}`).emit("screen-share-started", {
        userId,
        streamId: data.streamId
      });
    } catch (error) {
      console.error("Error starting screen share:", error);
    }
  });

  socket.on("stop-screen-share", async (data) => {
    const { meetingId, userId } = data;
    const MeetingSession = require('./models/MeetingSession');
    
    try {
      await MeetingSession.updateOne(
        { meeting: meetingId, user: userId },
        { 
          'mediaState.screen.sharing': false,
          lastActive: new Date()
        }
      );

      socket.to(`meeting-${meetingId}`).emit("screen-share-stopped", { userId });
    } catch (error) {
      console.error("Error stopping screen share:", error);
    }
  });

  // Meeting chat
  socket.on("meeting-chat", async (data) => {
    const { meetingId, userId, message } = data;
    const Meeting = require('./models/Meeting');
    
    try {
      await Meeting.findByIdAndUpdate(meetingId, {
        $push: {
          chat: {
            sender: userId,
            message: message,
            timestamp: new Date()
          }
        }
      });

      io.to(`meeting-${meetingId}`).emit("meeting-chat-message", {
        userId,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error sending meeting chat:", error);
    }
  });

  // Reactions
  socket.on("meeting-reaction", async (data) => {
    const { meetingId, userId, emoji } = data;
    const Meeting = require('./models/Meeting');
    
    try {
      await Meeting.findByIdAndUpdate(meetingId, {
        $push: {
          reactions: {
            user: userId,
            emoji: emoji,
            timestamp: new Date()
          }
        }
      });

      socket.to(`meeting-${meetingId}`).emit("meeting-reaction", {
        userId,
        emoji,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error sending reaction:", error);
    }
  });

  // Raise hand
  socket.on("raise-hand", async (data) => {
    const { meetingId, userId, raised } = data;
    const MeetingSession = require('./models/MeetingSession');
    
    try {
      await MeetingSession.updateOne(
        { meeting: meetingId, user: userId },
        { 
          'raisedHand.isRaised': raised,
          'raisedHand.raisedAt': raised ? new Date() : null,
          lastActive: new Date()
        }
      );

      socket.to(`meeting-${meetingId}`).emit("hand-raised", {
        userId,
        raised
      });
    } catch (error) {
      console.error("Error raising hand:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    // Clean up meeting sessions
    try {
      const MeetingSession = require('./models/MeetingSession');
      MeetingSession.updateMany(
        { socketId: socket.id },
        { 
          isActive: false, 
          leftAt: new Date(),
          lastActive: new Date()
        }
      ).catch(err => console.error("Error cleaning up sessions:", err));
    } catch (error) {
      console.error("Error requiring MeetingSession:", error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
