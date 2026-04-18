const Employee = require("../models/Employee");
const Task = require("../models/Task");
const mongoose = require("mongoose");

const getDashboardStats = async (req, res) => {
  try {
    console.log("getDashboardStats - organizationId:", req.organizationId);

    // Convert string to ObjectId for querying
    const orgId = new mongoose.Types.ObjectId(req.organizationId);

    const totalEmployees = await Employee.countDocuments({
      organizationId: orgId,
    });

    const activeEmployees = await Employee.countDocuments({
      organizationId: orgId,
      isActive: true,
    });

    const totalTasks = await Task.countDocuments({
      organizationId: orgId,
    });

    const assignedTasks = await Task.countDocuments({
      organizationId: orgId,
      status: "Assigned",
    });

    const inProgressTasks = await Task.countDocuments({
      organizationId: orgId,
      status: "In Progress",
    });

    const completedTasks = await Task.countDocuments({
      organizationId: orgId,
      status: "Completed",
    });

    const departments = await Employee.aggregate([
      { $match: { organizationId: orgId } },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    console.log("Departments fetched:", departments);

    res.json({
      totalEmployees,
      activeEmployees,
      totalTasks,
      assignedTasks,
      inProgressTasks,
      completedTasks,
      departments,
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getDashboardStats };
