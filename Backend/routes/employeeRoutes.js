const express = require("express");
const router = express.Router();

const {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/", protect, adminOnly, addEmployee);
router.get("/", protect, getEmployees);

router.get("/:id", protect, adminOnly, getEmployeeById);
router.put("/:id", protect, adminOnly, updateEmployee);
router.delete("/:id", protect, adminOnly, deleteEmployee);

module.exports = router;
