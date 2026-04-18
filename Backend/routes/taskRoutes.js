const express = require("express");
const router = express.Router();

const {
  createTask,
  getTasks,
  getTaskById,
  getMyTasks,
  updateTaskStatus,
  getProductivity,
  deleteTask,
} = require("../controllers/taskController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Admin routes
router.post("/", protect, adminOnly, createTask);
router.get("/", protect, adminOnly, getTasks);

// Employee routes (specific routes must come before parameterized routes)
router.get("/my-tasks", protect, getMyTasks);
router.get("/productivity", protect, getProductivity);

// Parameterized routes
router.get("/:id", protect, getTaskById);
router.put("/:id/status", protect, updateTaskStatus);
router.delete("/:id", protect, adminOnly, deleteTask);

module.exports = router;
