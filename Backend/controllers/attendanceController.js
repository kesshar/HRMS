const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const AttendanceTimer = require('../models/AttendanceTimer');

const ATTENDANCE_TIMER_SECONDS = 60;

const isAdminRole = (role) => ['ADMIN', 'HR'].includes((role || '').toString().toUpperCase());

const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const serializeTimer = (timer) => {
  const now = new Date();

  if (!timer) {
    return {
      status: 'not_started',
      hasStartedToday: false,
      remainingSeconds: 0,
      durationSeconds: ATTENDANCE_TIMER_SECONDS,
      serverNow: now.toISOString(),
      startedAt: null,
      expiresAt: null
    };
  }

  const remainingMs = Math.max(0, timer.expiresAt.getTime() - now.getTime());
  const remainingSeconds = Math.ceil(remainingMs / 1000);

  return {
    status: remainingSeconds > 0 ? 'running' : 'expired',
    hasStartedToday: true,
    remainingSeconds,
    durationSeconds: timer.durationSeconds || ATTENDANCE_TIMER_SECONDS,
    serverNow: now.toISOString(),
    startedAt: timer.startedAt.toISOString(),
    expiresAt: timer.expiresAt.toISOString()
  };
};

const getTodayTimer = (organizationId) => (
  AttendanceTimer.findOne({
    organization: organizationId,
    dateKey: getDateKey()
  })
);

const getCurrentTimerStatus = async (req, res) => {
  try {
    const timer = await getTodayTimer(req.organizationId);
    res.status(200).json(serializeTimer(timer));
  } catch (error) {
    console.error('Error in getCurrentTimerStatus:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const startAttendanceTimer = async (req, res) => {
  try {
    if (!isAdminRole(req.role)) {
      return res.status(403).json({ message: 'Only HR can start the attendance timer' });
    }

    const organizationId = req.organizationId;
    const now = new Date();
    const dateKey = getDateKey(now);
    const expiresAt = new Date(now.getTime() + ATTENDANCE_TIMER_SECONDS * 1000);

    const existingTimer = await AttendanceTimer.findOne({
      organization: organizationId,
      dateKey
    });

    if (existingTimer) {
      return res.status(409).json({
        message: 'Attendance timer has already been started for today',
        timer: serializeTimer(existingTimer)
      });
    }

    const timer = await AttendanceTimer.create({
      organization: organizationId,
      dateKey,
      startedAt: now,
      expiresAt,
      durationSeconds: ATTENDANCE_TIMER_SECONDS,
      startedBy: req.user.id
    });

    res.status(201).json(serializeTimer(timer));
  } catch (error) {
    if (error.code === 11000) {
      const timer = await getTodayTimer(req.organizationId);
      return res.status(409).json({
        message: 'Attendance timer has already been started for today',
        timer: serializeTimer(timer)
      });
    }

    console.error('Error in startAttendanceTimer:', error.stack || error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Check in
const checkIn = async (req, res, next) => {
  try {
    const { latitude, longitude, address } = req.body;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;
    const timer = await getTodayTimer(organizationId);
    const timerStatus = serializeTimer(timer);

    if (timerStatus.status !== 'running') {
      return res.status(403).json({
        message: timerStatus.status === 'not_started'
          ? 'Attendance timer has not been started by HR yet'
          : 'Attendance timer has expired for today'
      });
    }

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
  getCurrentTimerStatus,
  startAttendanceTimer,
  addManualAttendance,
  getAttendanceStats,
  getAttendanceByDate,
  getAttendanceByEmployee
};
