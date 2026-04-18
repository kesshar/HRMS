const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

// Check in
const checkIn = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    let attendance;
    if (existingAttendance) {
      // Update existing record (might be a leave or holiday record)
      attendance = existingAttendance;
      attendance.checkIn = {
        time: new Date(),
        location: { latitude, longitude, address },
        deviceId: req.headers['user-agent'],
        ip: req.ip
      };
      attendance.status = 'present';
    } else {
      // Create new attendance record
      attendance = new Attendance({
        organization: organizationId,
        employee: employeeId,
        date: today,
        checkIn: {
          time: new Date(),
          location: { latitude, longitude, address },
          deviceId: req.headers['user-agent'],
          ip: req.ip
        },
        status: 'present'
      });
    }

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Error in checkIn:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Check out
const checkOut = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    // Find today's attendance record
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'No check-in record found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: { latitude, longitude, address },
      deviceId: req.headers['user-agent'],
      ip: req.ip
    };

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name');

    res.status(200).json(populatedAttendance);
  } catch (error) {
    console.error('Error in checkOut:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get attendance history for current user
const getMyAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 30 } = req.query;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    const filter = {
      organization: organizationId,
      employee: employeeId
    };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(filter)
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    res.status(200).json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getMyAttendance:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get attendance for all employees (admin)
const getAllAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId, status, page = 1, limit = 30 } = req.query;
    const organizationId = req.organizationId;

    const filter = { organization: organizationId };

    if (employeeId) {
      filter.employee = employeeId;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (status) {
      filter.status = status;
    }

    const attendance = await Attendance.find(filter)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments(filter);

    res.status(200).json({
      attendance,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error in getAllAttendance:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get today's attendance status
const getTodayAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('approvedBy', 'name');

    res.status(200).json(attendance);
  } catch (error) {
    console.error('Error in getTodayAttendance:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Add manual attendance (admin)
const addManualAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, checkInTime, checkOutTime, status, notes } = req.body;
    const organizationId = req.organizationId;
    const approvedBy = req.user.id;

    if (!employeeId || !date) {
      return res.status(400).json({ message: 'Employee ID and date are required' });
    }

    // Check if employee exists
    const employee = await Employee.findOne({
      _id: employeeId,
      organizationId: organizationId
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: new Date(date)
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already exists for this date' });
    }

    const attendance = new Attendance({
      organization: organizationId,
      employee: employeeId,
      date: new Date(date),
      checkIn: checkInTime ? { time: new Date(checkInTime) } : undefined,
      checkOut: checkOutTime ? { time: new Date(checkOutTime) } : undefined,
      status: status || 'present',
      notes,
      approvedBy,
      manualEntry: true,
      isApproved: true
    });

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email')
      .populate('approvedBy', 'name');

    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error('Error in addManualAttendance:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get attendance statistics
const getAttendanceStats = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const organizationId = req.organizationId;

    const filter = { organization: organizationId };
    if (employeeId) filter.employee = employeeId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const stats = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$totalHours' },
          overtimeHours: { $sum: '$overtimeHours' }
        }
      }
    ]);

    const totalDays = await Attendance.countDocuments(filter);

    res.status(200).json({
      stats,
      totalDays
    });
  } catch (error) {
    console.error('Error in getAttendanceStats:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ============================================================
//  QR Session Management
// ============================================================
const AttendanceSession = require('../models/AttendanceSession');
const crypto = require('crypto');

// Haversine distance in metres between two lat/lon points
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// POST /attendance/qr/generate  (admin only)
const generateQRSession = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      return res.status(400).json({ message: 'Organization context missing' });
    }

    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 1000); // 60 seconds

    // Deactivate any existing active sessions for this org
    await AttendanceSession.updateMany(
      { organization: organizationId, isActive: true },
      { isActive: false }
    );

    const session = await AttendanceSession.create({
      organization: organizationId,
      sessionId,
      createdAt: now,
      expiresAt,
      isActive: true,
      generatedBy: req.user?.id
    });

    res.status(201).json({
      sessionId: session.sessionId,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error in generateQRSession:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// GET /attendance/qr/active  (admin only)
const getActiveSession = async (req, res, next) => {
  try {
    const organizationId = req.organizationId;
    const now = new Date();

    const session = await AttendanceSession.findOne({
      organization: organizationId,
      isActive: true,
      expiresAt: { $gt: now }
    }).sort({ createdAt: -1 });

    if (!session) {
      return res.status(404).json({ message: 'No active session' });
    }

    res.status(200).json({
      sessionId: session.sessionId,
      timestamp: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString()
    });
  } catch (error) {
    console.error('Error in getActiveSession:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// POST /attendance/qr/mark  (employee)
const markQRAttendance = async (req, res, next) => {
  require('dotenv').config();
  try {
    console.log('🚀 QR API HIT - markQRAttendance called');
    const { sessionId, latitude, longitude } = req.body;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;
    console.log('  sessionId :', sessionId);
    console.log('  latitude  :', latitude, '| longitude:', longitude);
    console.log('  employeeId:', employeeId, '| org:', organizationId);

    if (!sessionId || latitude == null || longitude == null) {
      return res.status(400).json({ message: 'sessionId, latitude and longitude are required' });
    }


    // 1. Validate session exists and is not expired
    const now = new Date();
    const session = await AttendanceSession.findOne({
      organization: organizationId,
      sessionId,
      isActive: true,
      expiresAt: { $gt: now }
    });

    if (!session) {
      return res.status(400).json({
        message: 'QR code is expired or invalid. Please ask HR to generate a new one.',
        code: 'QR_EXPIRED'
      });
    }

    // 2. Check geolocation – office coordinates (New Delhi default)
    const OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '15.759406');
    const OFFICE_LON = parseFloat(process.env.OFFICE_LON || '78.039299');
    const MAX_DISTANCE_M = parseFloat(process.env.OFFICE_RADIUS_M || '150');

    console.log("OFFICE LAT:", OFFICE_LAT);
    console.log("OFFICE LON:", OFFICE_LON);
    console.log("USER LAT:", latitude);
    console.log("USER LON:", longitude);

    const distanceM = haversineDistance(latitude, longitude, OFFICE_LAT, OFFICE_LON);

    if (distanceM > MAX_DISTANCE_M) {
      return res.status(400).json({
        message: `You are ${Math.round(distanceM)}m away from the office. Must be within ${MAX_DISTANCE_M}m to mark attendance.`,
        code: 'OUT_OF_RANGE',
        distance: Math.round(distanceM)
      });
    }

    // 3. Check for duplicate attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({
      organization: organizationId,
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        message: 'Attendance already marked for today.',
        code: 'DUPLICATE'
      });
    }

    // 4. Mark attendance
    let attendance;
    if (existingAttendance) {
      attendance = existingAttendance;
      attendance.checkIn = {
        time: now,
        location: { latitude, longitude },
        deviceId: req.headers['user-agent'],
        ip: req.ip
      };
      attendance.status = 'present';
    } else {
      attendance = new Attendance({
        organization: organizationId,
        employee: employeeId,
        date: today,
        checkIn: {
          time: now,
          location: { latitude, longitude },
          deviceId: req.headers['user-agent'],
          ip: req.ip
        },
        status: 'present'
      });
    }

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employee', 'name email');

    res.status(201).json({
      message: 'Attendance marked successfully!',
      attendance: populatedAttendance
    });
  } catch (error) {
    console.error('Error in markQRAttendance:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// GET /attendance/date/:date  (admin)
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const organizationId = req.organizationId;

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get all attendance records for this date
    const records = await Attendance.find({
      organization: organizationId,
      date: { $gte: dayStart, $lt: dayEnd }
    }).populate('employee', 'name email profileImage department');

    // Get all employees in the org
    const allEmployees = await Employee.find({ organizationId });

    const presentIds = new Set(records.map(r => r.employee?._id?.toString()));

    const present = records
      .filter(r => r.status === 'present' || r.checkIn)
      .map(r => ({
        employee: r.employee,
        checkInTime: r.checkIn?.time,
        location: r.checkIn?.location,
        status: r.status
      }));

    const absent = allEmployees
      .filter(emp => !presentIds.has(emp._id.toString()))
      .map(emp => ({ employee: { _id: emp._id, name: emp.name, email: emp.email } }));

    res.status(200).json({ date, present, absent, total: allEmployees.length });
  } catch (error) {
    console.error('Error in getAttendanceByDate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /attendance/employee/:id  (admin)
const getAttendanceByEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.organizationId;
    const { limit = 30 } = req.query;

    const records = await Attendance.find({
      organization: organizationId,
      employee: id
    })
      .sort({ date: -1 })
      .limit(Number(limit));

    res.status(200).json(records);
  } catch (error) {
    console.error('Error in getAttendanceByEmployee:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
