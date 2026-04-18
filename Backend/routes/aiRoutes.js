const express = require("express");
const router = express.Router();

const { getProductivityScore } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.get("/productivity/:employeeId", protect, getProductivityScore);

module.exports = router;
