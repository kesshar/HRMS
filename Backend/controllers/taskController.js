// const Task = require("../models/Task");

// // Admin assigns task
// const createTask = async (req, res) => {
//   const { title, description, assignedTo, deadline } = req.body;

//   const task = await Task.create({
//     organizationId: req.organizationId,
//     title,
//     description,
//     assignedTo,
//     deadline,
//     status: "Assigned",
//   });

//   res.status(201).json(task);
// };

// // Get all tasks (Admin)
// const getTasks = async (req, res) => {
//   const tasks = await Task.find({ organizationId: req.organizationId })
//     .populate("assignedTo", "name email role department")
//     .sort({ createdAt: -1 });

//   res.json(tasks);
// };

// // Get task by ID
// const getTaskById = async (req, res) => {
//   const task = await Task.findById(req.params.id).populate(
//     "assignedTo",
//     "name email role department"
//   );

//   if (!task) {
//     res.status(404);
//     throw new Error("Task not found");
//   }

//   res.json(task);
// };

// // Get tasks for employee
// const getTasksByEmployee = async (req, res) => {
//   const tasks = await Task.find({
//     assignedTo: req.params.employeeId,
//     organizationId: req.organizationId,
//   }).sort({ createdAt: -1 });

//   res.json(tasks);
// };

// const updateTaskStatus = async (req, res) => {
//   const { status } = req.body;

//   const task = await Task.findById(req.params.id);

//   if (!task) {
//     res.status(404);
//     throw new Error("Task not found");
//   }

//   // Must belong to same organization
//   if (task.organizationId.toString() !== req.organizationId.toString()) {
//     res.status(403);
//     throw new Error("Not allowed to update this task");
//   }

//   // 🔐 If employee → can only update their own task
//   if (req.role === "employee") {
//     if (task.assignedTo.toString() !== req.user.id) {
//       res.status(403);
//       throw new Error("You can only update your own tasks");
//     }
//   }

//   if (!["Assigned", "In Progress", "Completed"].includes(status)) {
//     res.status(400);
//     throw new Error("Invalid status value");
//   }

//   task.status = status;

//   if (status === "Completed") {
//     task.completedAt = new Date();
//   }

//   const updatedTask = await task.save();

//   res.json(updatedTask);
// };

// module.exports = {
//   createTask,
//   getTasks,
//   getTaskById,
//   getTasksByEmployee,
//   updateTaskStatus,
//   getMyTasks,
// };

const Task = require("../models/Task");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");

/* ======================================================
   1️⃣ Admin assigns task
====================================================== */
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, deadline } = req.body;

    if (req.role !== "ADMIN") {
      return res.status(403).json({ error: "Only admin can assign tasks" });
    }

    if (!assignedTo) {
      return res.status(400).json({ error: "assignedTo is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
      return res.status(400).json({ error: "Invalid assignedTo id" });
    }

    // 1️⃣ Check if employee exists
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // 2️⃣ Ensure employee belongs to same organization
    if (employee.organizationId.toString() !== req.organizationId.toString()) {
      return res.status(403).json({ error: "Employee does not belong to your organization" });
    }

    const task = await Task.create({
      organizationId: req.organizationId,
      title,
      description,
      assignedTo,
      deadline,
      status: "Assigned",
    });

    return res.status(201).json(task);
  } catch (err) {
    console.error("createTask error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   2️⃣ Admin - Get all tasks
====================================================== */
const getTasks = async (req, res) => {
  if (req.role !== "ADMIN") {
    res.status(403);
    throw new Error("Admin access only");
  }

  const tasks = await Task.find({
    organizationId: req.organizationId,
  })
    .populate("assignedTo", "name email role department")
    .sort({ createdAt: -1 });

  res.json(tasks);
};

/* ======================================================
   3️⃣ Get task by ID (Admin)
====================================================== */
const getTaskById = async (req, res) => {
  const task = await Task.findById(req.params.id).populate(
    "assignedTo",
    "name email role department"
  );

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.organizationId.toString() !== req.organizationId.toString()) {
    res.status(403);
    throw new Error("Not allowed");
  }

  res.json(task);
};

/* ======================================================
   4️⃣ Employee - Get only their tasks
====================================================== */
const getMyTasks = async (req, res) => {
  try {
    if (req.role !== "EMPLOYEE") {
      return res.status(403).json({ error: "Employee access only" });
    }

    const tasks = await Task.find({
      assignedTo: req.user.id,
      organizationId: req.organizationId,
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error("getMyTasks error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   5️⃣ Update task status (Employee or Admin)
====================================================== */
const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    console.log("updateTaskStatus id:", req.params.id, "status:", status);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Must belong to same organization
    if (task.organizationId.toString() !== req.organizationId.toString()) {
      return res.status(403).json({ error: "Not allowed to update this task" });
    }

    // 🔐 Employee can update only their own task
    if (req.role === "EMPLOYEE") {
      if (task.assignedTo.toString() !== req.user.id) {
        return res.status(403).json({ error: "You can update only your tasks" });
      }
    }

    const allowed = ["Assigned", "In Progress", "Completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value", allowed });
    }

    task.status = status;

    if (status === "Completed") {
      task.completedAt = new Date();
    }

    const updatedTask = await task.save();

    return res.json(updatedTask);
  } catch (err) {
    console.error("updateTaskStatus error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   6️⃣ Employee Productivity Score
====================================================== */
const getProductivity = async (req, res) => {
  try {
    console.log("getProductivity: role=", req.role, "user=", req.user && req.user.id);
    if (req.role !== "EMPLOYEE") {
      return res.status(403).json({ error: "Employee access only" });
    }

    const totalTasks = await Task.countDocuments({
      assignedTo: req.user.id,
      organizationId: req.organizationId,
    });

    const completedTasks = await Task.countDocuments({
      assignedTo: req.user.id,
      organizationId: req.organizationId,
      status: "Completed",
    });

    const productivityScore =
      totalTasks === 0 ? 0 : ((completedTasks / totalTasks) * 100).toFixed(2);

    return res.json({
      totalTasks,
      completedTasks,
      productivityScore,
    });
  } catch (err) {
    console.error("getProductivity error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ======================================================
   7️⃣ Admin - Delete task
====================================================== */
const deleteTask = async (req, res) => {
  if (req.role !== "ADMIN") {
    res.status(403);
    throw new Error("Admin access only");
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  if (task.organizationId.toString() !== req.organizationId.toString()) {
    res.status(403);
    throw new Error("Not allowed");
  }

  await task.deleteOne();

  res.json({ message: "Task deleted successfully" });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  getMyTasks,
  updateTaskStatus,
  getProductivity,
  deleteTask,
};