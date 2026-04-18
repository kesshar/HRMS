const express = require("express");
const router = express.Router();
const { protect, adminOnly, employeeOnly } = require("../middleware/authMiddleware");

const {
  createGroupProject,
  getGroups,
  createGroupTask,
  getGroupTasks,
  updateTaskStatus,
  reviewTaskProof
} = require("../controllers/groupController");

// =======================
// Admin/HR Only Routes
// =======================
router.post("/project", protect, adminOnly, createGroupProject);
router.post("/task", protect, adminOnly, createGroupTask);
router.patch("/task/:taskId/review", protect, adminOnly, reviewTaskProof);

// =======================
// Shared Routes (Admin & Employee)
// =======================
// Fetches groups (Admin sees all org groups, Employee sees their assigned groups)
router.get("/", protect, getGroups);

// Fetches tasks for a specific group
router.get("/:groupId/tasks", protect, getGroupTasks);

// =======================
// Employee Actions (Group Leader restricted at controller level)
// =======================
router.patch("/task/:taskId/status", protect, employeeOnly, updateTaskStatus);

module.exports = router;
