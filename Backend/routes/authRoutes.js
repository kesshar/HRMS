const express = require("express");
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  loginEmployee,
  login,
  getProfile,
  uploadProfilePic,
} = require("../controllers/authController");

const upload = require("../utils/fileUpload");

const { protect } = require("../middleware/authMiddleware");

router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);

router.post("/login", login);
router.get("/profile", protect, getProfile);
router.post("/upload-profile-pic", protect, upload.single('profilePic'), uploadProfilePic);
router.get("/debug/me", protect, (req, res) => {
  res.json({
    user: req.user,
    role: req.role,
    organizationId: req.organizationId
  });
});

router.post("/employee/login", loginEmployee);

module.exports = router;
