const GroupProject = require("../models/GroupProject");
const GroupTask = require("../models/GroupTask");
const Employee = require("../models/Employee");

// ==========================================
// GROUP PROJECT CONTROLLERS
// ==========================================

// Create a new Group Project (Admin/HR Only)
const createGroupProject = async (req, res) => {
  try {
    const { name, description, deadline, members, leaderId } = req.body;
    const organizationId = req.organizationId;

    if (!name || !deadline || !members || !leaderId) {
      return res.status(400).json({ message: "Please provide all required fields." });
    }

    // Ensure the leader is part of the members array
    if (!members.includes(leaderId)) {
      members.push(leaderId);
    }

    const newGroup = await GroupProject.create({
      organizationId,
      name,
      description,
      deadline,
      members,
      leaderId,
    });

    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating group project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all groups for the organization, or groups where employee is a member
const getGroups = async (req, res) => {
  try {
    const isAdmin = req.role === "ADMIN";
    const organizationId = req.organizationId;
    let filter = { organizationId: organizationId };

    if (!isAdmin) {
      // If employee, only get groups where they are a member
      filter.members = req.user.id;
    }

    const groups = await GroupProject.find(filter)
      .populate("leaderId", "name email")
      .populate("members", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ==========================================
// GROUP TASK CONTROLLERS
// ==========================================

// Assign a task to a group (Admin/HR Only)
const createGroupTask = async (req, res) => {
  try {
    const { groupId, title, description, deadline } = req.body;
    const organizationId = req.organizationId;

    if (!groupId || !title) {
      return res.status(400).json({ message: "Group ID and Title are required." });
    }

    // Verify group exists and belongs to org
    const group = await GroupProject.findOne({ _id: groupId, organizationId });
    if (!group) return res.status(404).json({ message: "Group not found." });

    const newTask = await GroupTask.create({
      organizationId,
      groupId,
      title,
      description,
      deadline,
    });

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating group task:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get tasks for a specific group
const getGroupTasks = async (req, res) => {
  try {
    const { groupId } = req.params;
    const isAdmin = req.role === "ADMIN";

    const group = await GroupProject.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    // Access check for employees: must be a member
    if (!isAdmin && !group.members.includes(req.user.id)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    const tasks = await GroupTask.find({ groupId }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching group tasks:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update task status and upload proof (Group Leader Only)
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status, proofType, proofContent } = req.body;
    const userId = req.user.id;
    const isAdmin = req.role === "ADMIN";

    const task = await GroupTask.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const group = await GroupProject.findById(task.groupId);

    // Permission Check: Must be leader (or admin fixing things)
    if (!isAdmin && group.leaderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the Group Leader can update task status." });
    }

    // Update fields
    if (status) task.status = status;
    if (proofType) task.proofType = proofType;
    if (proofContent) task.proofContent = proofContent;

    if (status === "Submitted") {
      task.submittedAt = new Date();
    }

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// HR Review Flow (Admin/HR Only)
const reviewTaskProof = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { action, hrFeedback } = req.body; // action: 'Accept' or 'Reject'

    const task = await GroupTask.findOne({ _id: taskId, organizationId: req.organizationId });
    if (!task) return res.status(404).json({ message: "Task not found." });

    if (action === "Accept") {
      task.status = "Completed";
      task.completedAt = new Date();
    } else if (action === "Reject") {
      task.status = "In Progress";
    } else {
      return res.status(400).json({ message: "Invalid review action." });
    }

    task.hrFeedback = hrFeedback || "";
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.error("Error reviewing task proof:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createGroupProject,
  getGroups,
  createGroupTask,
  getGroupTasks,
  updateTaskStatus,
  reviewTaskProof
};
