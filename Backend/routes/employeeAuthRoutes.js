const express = require("express");
const router = express.Router();
const { employeeLogin, getEmployeeProfile } = require("../controllers/employeeAuthController");
const { protect } = require("../middleware/authMiddleware");

router.post("/login", employeeLogin);
router.get("/profile", protect, getEmployeeProfile);

module.exports = router;