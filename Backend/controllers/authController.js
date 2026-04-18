const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const Organization = require("../models/Organization");
const Employee = require("../models/Employee");
const Organization1 = require("../models/Organization1");
const User = require("../models/User");

// Generate Token
const generateToken = (id, role, organizationId) => {
  // Use hardcoded JWT secret for now since .env has formatting issues
  const jwtSecret = "Psingh@12345";
  return jwt.sign({ id, role, organizationId }, jwtSecret, {
    expiresIn: "7d",
  });
};

// Admin Register
const registerAdmin = async (req, res) => {
  const { companyName, email, password } = req.body;

  const orgExists = await Organization.findOne({ email });

  if (orgExists) {
    res.status(400);
    throw new Error("Organization already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const organization = await Organization.create({
    companyName,
    email,
    password: hashedPassword,
  });

  res.status(201).json({
    _id: organization._id,
    companyName: organization.companyName,
    email: organization.email,
    token: generateToken(organization._id, "ADMIN", organization._id),
  });
};

// Admin Login
const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  const organization = await Organization.findOne({ email });

  if (organization && (await bcrypt.compare(password, organization.password))) {
    res.json({
      _id: organization._id,
      companyName: organization.companyName,
      email: organization.email,
      token: generateToken(organization._id, "ADMIN", organization._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
};

// Employee Login
const loginEmployee = async (req, res) => {
  const { email, password } = req.body;

  const employee = await Employee.findOne({ email });

  if (employee && (await bcrypt.compare(password, employee.password))) {
    res.json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      organizationId: employee.organizationId,
      token: generateToken(employee._id, "EMPLOYEE", employee.organizationId),
    });
  } else {
    res.status(401);
    throw new Error("Invalid employee email or password");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Use hardcoded JWT secret for now since .env has formatting issues
    const jwtSecret = "Psingh@12345";
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        orgId: user.organizationId,
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.json({ token, userId: user._id, role: user.role });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get profile for currently authenticated user/admin
const getProfile = async (req, res) => {
  try {
    console.log("getProfile: req.user.id ->", req.user.id);
    console.log("getProfile: req.role ->", req.role);

    if (req.role === "ADMIN") {
      const organization = await Organization.findById(req.user.id).select("-password");
      if (organization) return res.json(organization);
      
      const user = await User.findById(req.user.id).select("-password");
      if (user) return res.json(user);
    }

    const employee = await Employee.findById(req.user.id).select("-password");
    if (employee) return res.json(employee);

    const userAsFallback = await User.findById(req.user.id).select("-password");
    if (userAsFallback) return res.json(userAsFallback);

    console.error("getProfile: Profile not found for id ->", req.user.id);
    return res.status(404).json({ message: "Profile not found" });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const userId = req.user.id;
    const profilePicUrl = `/uploads/profile_pics/${req.file.filename}`;

    // Try updating in all possible models
    let updated = false;

    // 1. Try Employee
    let user = await Employee.findByIdAndUpdate(userId, { profilePic: profilePicUrl }, { new: true });
    if (user) updated = true;

    // 2. Try Organization
    if (!updated) {
      user = await Organization.findByIdAndUpdate(userId, { profilePic: profilePicUrl }, { new: true });
      if (user) updated = true;
    }
    
    // 3. Try Organization1
    if (!updated) {
      user = await Organization1.findByIdAndUpdate(userId, { profilePic: profilePicUrl }, { new: true });
      if (user) updated = true;
    }

    // 4. Try User
    if (!updated) {
      user = await User.findByIdAndUpdate(userId, { profilePic: profilePicUrl }, { new: true });
      if (user) updated = true;
    }

    if (updated) {
      res.json({ message: "Profile picture updated successfully", profilePic: profilePicUrl });
    } else {
      res.status(404).json({ message: "User not found" });
    }

  } catch (error) {
    console.error("uploadProfilePic error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerAdmin, loginAdmin, loginEmployee, login, getProfile, uploadProfilePic };
