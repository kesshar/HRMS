const Performance = require("../models/Performance");
const Employee = require("../models/Employee");
const Attendance = require("../models/Attendance");
const LeaveRequest = require("../models/LeaveRequest");
const Task = require("../models/Task");

// Calculate Performance Engine
const generateLeaderboard = async (req, res) => {
  try {
    const { month, year, workingDaysConfig = 30 } = req.body;
    const organizationId = req.organizationId || req.user?.organizationId;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and Year required" });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    let empQuery = {};
    if (organizationId) {
       empQuery.organizationId = organizationId; 
    }
    const employees = await Employee.find(empQuery);
    const generated = [];

    if (employees.length === 0) {
      return res.status(400).json({ message: "No employees found to grade." });
    }

    for (let emp of employees) {
      const bonuses = [];
      const penalties = [];

      // 1. Attendance Math
      const authRecords = await Attendance.find({
        employee: emp._id,
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['present', 'late', 'half_day'] }
      });
      let presentDays = 0;
      authRecords.forEach(r => {
        if (r.status === 'half_day') presentDays += 0.5;
        else presentDays += 1;
      });

      let attendanceScoreRaw = (presentDays / workingDaysConfig) * 100;
      if (attendanceScoreRaw > 100) attendanceScoreRaw = 100;
      
      // Bonus: > 90% attendance
      if (attendanceScoreRaw >= 90) bonuses.push("High Attendance (+5)");

      // 2. Task Math
      const tasks = await Task.find({
        assignedTo: emp._id,
        createdAt: { $lte: endDate } // Assigned before or during month
        // Ideally should check deadline within month, but we'll approximate active tasks.
      }).lean();

      // Only count tasks that were active this month
      const activeTasks = tasks.filter(t => {
        const createT = new Date(t.createdAt).getTime();
        const endM = endDate.getTime();
        if (createT > endM) return false;
        if (t.status === "Completed" && t.completedAt) {
           const cT = new Date(t.completedAt).getTime();
           if (cT < startDate.getTime()) return false; // Completed before this month
        }
        return true;
      });

      const totalTasks = activeTasks.length;
      let completedTasks = 0;
      let tasksBeforeDeadline = 0;
      let missedDeadlines = 0;

      activeTasks.forEach(t => {
        if (t.status === "Completed") {
          completedTasks++;
          if (t.deadline && t.completedAt) {
             if (new Date(t.completedAt) <= new Date(t.deadline)) {
               tasksBeforeDeadline++;
             } else {
               missedDeadlines++;
             }
          } else {
             tasksBeforeDeadline++; // no deadline means done safely
          }
        } else {
           if (t.deadline && new Date() > new Date(t.deadline) && new Date(t.deadline) <= endDate) {
             missedDeadlines++;
           }
        }
      });

      let taskScoreRaw = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100; // If no tasks, give 100 free? Or 0? Let's say 100 so it doesn't drop their score arbitrarily.
      
      if (tasksBeforeDeadline > 0) bonuses.push("Fast Task Completion (+5)");
      if (missedDeadlines > 0) penalties.push("Missed Task Deadlines (-5)");

      // 3. Leaves Math
      const leaves = await LeaveRequest.find({
        employeeId: emp._id,
        status: "Approved",
        fromDate: { $lte: endDate },
        toDate: { $gte: startDate }
      });

      let lwpCount = 0;
      let totalLeaves = 0;

      leaves.forEach(lv => {
        const lStart = Math.max(new Date(lv.fromDate).getTime(), startDate.getTime());
        const lEnd = Math.min(new Date(lv.toDate).getTime(), endDate.getTime());
        if (lStart <= lEnd) {
          const days = Math.ceil(Math.abs(lEnd - lStart) / (1000 * 60 * 60 * 24)) + 1;
          totalLeaves += days;
          if (lv.leaveType === "LWP") lwpCount += days;
        }
      });

      let leaveScoreRaw = 100 - (totalLeaves * 5) - (lwpCount * 10);
      if (leaveScoreRaw < 0) leaveScoreRaw = 0;
      if (lwpCount > 3) penalties.push("Excessive LWP (-5)");

      // Fetch existing HR rating or create new record
      let existingPerf = await Performance.findOne({ employeeId: emp._id, month, year });
      const hrRating = existingPerf ? existingPerf.hrRating : 3; 

      // 4. Weighting Formulas
      /* 
         (attendanceScore * 0.4) + (taskScore * 0.3) + (leaveScore * 0.15) + (hrRatingScore * 0.15)
      */
      const attendanceFinal = attendanceScoreRaw * 0.4;
      const taskFinal = taskScoreRaw * 0.3;
      const leaveFinal = leaveScoreRaw * 0.15;
      const hrFinal = (hrRating / 5) * 100 * 0.15;

      let finalScore = attendanceFinal + taskFinal + leaveFinal + hrFinal;

      // Apply Bonuses & Penalties cleanly
      if (bonuses.length > 0) finalScore += (bonuses.length * 5);
      if (penalties.length > 0) finalScore -= (penalties.length * 5);

      if (finalScore > 100) finalScore = 100;
      if (finalScore < 0) finalScore = 0;

      // Save to DB
      const payload = {
        organizationId: emp.organizationId || emp.organization || organizationId,
        employeeId: emp._id,
        month,
        year,
        attendanceScore: attendanceScoreRaw,
        taskScore: taskScoreRaw,
        leaveScore: leaveScoreRaw,
        hrRating,
        finalScore,
        breakdown: {
          presentDays,
          workingDays: workingDaysConfig,
          totalTasks,
          completedTasks,
          tasksBeforeDeadline,
          missedDeadlines,
          totalLeaves,
          lwpLeaves: lwpCount
        },
        bonusesApplied: bonuses,
        penaltiesApplied: penalties
      };

      if (existingPerf) {
        existingPerf = await Performance.findByIdAndUpdate(existingPerf._id, payload, { new: true });
        generated.push(existingPerf);
      } else {
        const newlyCreated = await Performance.create(payload);
        generated.push(newlyCreated);
      }
    }

    res.status(200).json({ message: "Engine successfully processed mathematical rankings.", count: generated.length });

  } catch (error) {
    res.status(500).json({ message: "Algorithm failed", error: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: "Month/Year required" });
    
    // Sort descending by Final Score
    const rankings = await Performance.find({ month, year })
      .populate("employeeId", "name email department avatar")
      .sort({ finalScore: -1 });

    // Inject exact mathematical ranking
    const finalRanked = rankings.map((r, index) => ({
      ...r.toObject(),
      rank: index + 1
    }));

    res.status(200).json(finalRanked);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve leaderboard", error: error.message });
  }
};

const updateHRRating = async (req, res) => {
  try {
    const { perfId, rating } = req.body;
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" });

    const perf = await Performance.findById(perfId);
    if (!perf) return res.status(404).json({ message: "Record not found" });

    perf.hrRating = rating;

    // Recalculate just the final payload based on the 15% diff
    // Subtract old rating weight, add new rating weight
    const oldHrFinal = (perf.hrRating / 5) * 100 * 0.15;
    const newHrFinal = (rating / 5) * 100 * 0.15;
    
    // Rebuild final score correctly to prevent additive infinite scaling. We should strictly re-add all base components.
    const attendanceFinal = perf.attendanceScore * 0.4;
    const taskFinal = perf.taskScore * 0.3;
    const leaveFinal = perf.leaveScore * 0.15;
    
    let baseFinal = attendanceFinal + taskFinal + leaveFinal + newHrFinal;
    baseFinal += (perf.bonusesApplied.length * 5);
    baseFinal -= (perf.penaltiesApplied.length * 5);

    if (baseFinal > 100) baseFinal = 100;
    if (baseFinal < 0) baseFinal = 0;

    perf.finalScore = baseFinal;
    await perf.save();

    res.status(200).json({ message: "Rating updated and mapped." });
  } catch (error) {
    res.status(500).json({ message: "Update fail", error: error.message });
  }
};

const getMyPerformance = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    // Fetch user
    const perf = await Performance.findOne({ employeeId: req.user.id, month, year });
    if (!perf) return res.status(404).json({ message: "No data mapped yet for this month" });

    // Derive Rank
    const rankQuery = await Performance.countDocuments({
       month, year, finalScore: { $gt: perf.finalScore }
    });
    const rank = rankQuery + 1;

    res.status(200).json({
      record: perf,
      rank
    });
  } catch (error) {
    res.status(500).json({ message: "Failed", error: error.message });
  }
};

module.exports = {
  generateLeaderboard,
  getLeaderboard,
  updateHRRating,
  getMyPerformance
};
