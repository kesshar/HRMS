const Leaderboard = require('../models/Leaderboard');
const Attendance = require('../models/Attendance');
const Task = require('../models/Task');
const Employee = require('../models/Employee');

// Calculate and update leaderboard scores
const calculateLeaderboardScores = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.body;
    const organizationId = req.organizationId;

    if (!period || !startDate || !endDate) {
      return res.status(400).json({ message: 'Period, start date, and end date are required' });
    }

    // Get all employees in the organization
    const employees = await Employee.find({ organizationId: organizationId });

    const leaderboardEntries = [];

    for (const employee of employees) {
      // Calculate attendance score
      const attendanceRecords = await Attendance.find({
        organization: organizationId,
        employee: employee._id,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter(r => r.status === 'present').length;
      const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
      
      // Attendance score: present days * 10 points, late days * 5 points
      const attendanceScore = (presentDays * 10) + (lateDays * 5);

      // Calculate task completion score
      const tasks = await Task.find({
        organization: organizationId,
        assignedTo: employee._id,
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const overdueTasks = tasks.filter(t => 
        t.status !== 'completed' && new Date(t.dueDate) < new Date()
      ).length;

      // Task score: completed tasks * 15 points, overdue tasks * -5 points
      const taskCompletionScore = (completedTasks * 15) + (overdueTasks * -5);

      const totalScore = attendanceScore + taskCompletionScore;

      // Check if leaderboard entry exists
      let leaderboardEntry = await Leaderboard.findOne({
        organization: organizationId,
        employee: employee._id,
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      });

      if (leaderboardEntry) {
        // Update existing entry
        const previousRank = leaderboardEntry.metrics.rank;
        leaderboardEntry.metrics.attendanceScore = attendanceScore;
        leaderboardEntry.metrics.taskCompletionScore = taskCompletionScore;
        leaderboardEntry.metrics.totalScore = totalScore;
        leaderboardEntry.metrics.previousRank = previousRank;
        leaderboardEntry.breakdown.totalDays = totalDays;
        leaderboardEntry.breakdown.presentDays = presentDays;
        leaderboardEntry.breakdown.lateDays = lateDays;
        leaderboardEntry.breakdown.totalTasks = totalTasks;
        leaderboardEntry.breakdown.completedTasks = completedTasks;
        leaderboardEntry.breakdown.overdueTasks = overdueTasks;
      } else {
        // Create new entry
        leaderboardEntry = new Leaderboard({
          organization: organizationId,
          employee: employee._id,
          period,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          metrics: {
            attendanceScore,
            taskCompletionScore,
            totalScore,
            rank: 0,
            previousRank: 0
          },
          breakdown: {
            totalDays,
            presentDays,
            lateDays,
            totalTasks,
            completedTasks,
            overdueTasks
          }
        });
      }

      // Add achievements
      const achievements = [];
      if (presentDays === totalDays && totalDays > 0) {
        achievements.push({
          type: 'perfect_attendance',
          date: new Date(),
          points: 50
        });
      }
      if (completedTasks === totalTasks && totalTasks > 10) {
        achievements.push({
          type: 'task_master',
          date: new Date(),
          points: 30
        });
      }
      if (lateDays === 0 && presentDays > 0) {
        achievements.push({
          type: 'early_bird',
          date: new Date(),
          points: 20
        });
      }

      leaderboardEntry.achievements = achievements;

      await leaderboardEntry.save();
      leaderboardEntries.push(leaderboardEntry);
    }

    // Sort by total score and assign ranks
    leaderboardEntries.sort((a, b) => b.metrics.totalScore - a.metrics.totalScore);
    leaderboardEntries.forEach((entry, index) => {
      entry.metrics.rank = index + 1;
      entry.save();
    });

    res.status(200).json({ 
      message: 'Leaderboard calculated successfully',
      entries: leaderboardEntries.length 
    });
  } catch (error) {
    console.error('Error in calculateLeaderboardScores:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { period = 'monthly', page = 1, limit = 20 } = req.query;
    const organizationId = req.organizationId;

    // Get current period dates
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
        endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const leaderboard = await Leaderboard.find({
      organization: organizationId,
      period,
      startDate,
      endDate
    })
    .populate('employee', 'name email profileImage')
    .sort({ 'metrics.rank': 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Leaderboard.countDocuments({
      organization: organizationId,
      period,
      startDate,
      endDate
    });

    res.status(200).json({
      leaderboard,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      period: {
        type: period,
        startDate,
        endDate
      }
    });
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get my leaderboard position
const getMyLeaderboardPosition = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    const employeeId = req.user.id;
    const organizationId = req.organizationId;

    // Get current period dates
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'weekly':
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
        endDate = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    const myEntry = await Leaderboard.findOne({
      organization: organizationId,
      employee: employeeId,
      period,
      startDate,
      endDate
    })
    .populate('employee', 'name email profileImage');

    if (!myEntry) {
      return res.status(404).json({ message: 'No leaderboard entry found for this period' });
    }

    // Get top performers for comparison
    const topPerformers = await Leaderboard.find({
      organization: organizationId,
      period,
      startDate,
      endDate
    })
    .populate('employee', 'name email profileImage')
    .sort({ 'metrics.rank': 1 })
    .limit(5);

    res.status(200).json({
      myEntry,
      topPerformers,
      totalParticipants: await Leaderboard.countDocuments({
        organization: organizationId,
        period,
        startDate,
        endDate
      })
    });
  } catch (error) {
    console.error('Error in getMyLeaderboardPosition:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get leaderboard history for an employee
const getLeaderboardHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period = 'monthly', limit = 12 } = req.query;
    const organizationId = req.organizationId;

    const history = await Leaderboard.find({
      organization: organizationId,
      employee: employeeId,
      period
    })
    .populate('employee', 'name email')
    .sort({ endDate: -1 })
    .limit(limit * 1);

    res.status(200).json(history);
  } catch (error) {
    console.error('Error in getLeaderboardHistory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Award reward to employee
const awardReward = async (req, res) => {
  try {
    const { employeeId, type, description, points } = req.body;
    const organizationId = req.organizationId;

    if (!employeeId || !type || !description || !points) {
      return res.status(400).json({ 
        message: 'Employee ID, type, description, and points are required' 
      });
    }

    // Get current monthly leaderboard entry
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const leaderboardEntry = await Leaderboard.findOne({
      organization: organizationId,
      employee: employeeId,
      period: 'monthly',
      startDate,
      endDate
    });

    if (!leaderboardEntry) {
      return res.status(404).json({ message: 'Leaderboard entry not found for this month' });
    }

    leaderboardEntry.rewards.push({
      type,
      description,
      points,
      date: new Date()
    });

    await leaderboardEntry.save();

    res.status(200).json({ message: 'Reward awarded successfully' });
  } catch (error) {
    console.error('Error in awardReward:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  calculateLeaderboardScores,
  getLeaderboard,
  getMyLeaderboardPosition,
  getLeaderboardHistory,
  awardReward
};
