const Task = require("../models/Task");
const calculateProductivityScore = require("../utils/productivityScore");

const getProductivityScore = async (req, res) => {
  const employeeId = req.params.employeeId;

  const tasks = await Task.find({
    assignedTo: employeeId,
    organizationId: req.organizationId,
  });

  const assignedTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;

  const now = new Date();
  const overdueTasks = tasks.filter(
    (t) => t.deadline && t.status !== "Completed" && t.deadline < now
  ).length;

  const score = calculateProductivityScore(
    completedTasks,
    assignedTasks,
    overdueTasks
  );

  res.json({
    employeeId,
    assignedTasks,
    completedTasks,
    overdueTasks,
    productivityScore: score,
  });
};

module.exports = { getProductivityScore };
