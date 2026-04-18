const Organization = require("../models/Organization1");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

exports.registerOrganization = async (req, res) => {
  try {
    const {
      companyName,
      email,
      industry,
      companySize,
      adminName,
      adminEmail,
      password,
    } = req.body;

    // 1️⃣ Check if organization already exists
    const existingOrg = await Organization.findOne({ email });
    if (existingOrg) {
      return res.status(400).json({ message: "Organization already exists" });
    }

    // 2️⃣ Create organization
    const organization = await Organization.create({
      companyName,
      email,
      industry,
      companySize,
    });

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create Admin user
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      organizationId: organization._id,
    });

    res.status(201).json({
      message: "Organization registered successfully",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};