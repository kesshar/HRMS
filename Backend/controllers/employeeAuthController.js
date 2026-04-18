const Employee = require("../models/Employee");
const jwt = require("jsonwebtoken");

const generateToken = (employee) => {
  const jwtSecret = "Psingh@12345";
  return jwt.sign(
    {
      id: employee._id,
      role: "EMPLOYEE",
      organizationId: employee.organizationId,
    },
    jwtSecret,
    { expiresIn: "7d" }
  );
};

const employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("employeeLogin attempt for:", email);

    const employee = await Employee.findOne({ email });

    if (!employee) {
      console.log("employeeLogin: no employee found for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!employee.isActive) {
      console.log("employeeLogin: account inactive for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await employee.matchPassword(password);

    if (!isMatch) {
      console.log("employeeLogin: password mismatch for", email);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      token: generateToken(employee),
    });
  } catch (err) {
    console.error("employeeLogin error:", err);
    res.status(500).json({ error: err.message });
  }
};

const getEmployeeProfile = async (req, res) => {
  if (req.role !== "EMPLOYEE") {
    return res.status(403).json({ error: "Employee access only" });
  }

  const employee = await Employee.findById(req.user.id)
    .select("-password");

  if (!employee) {
    return res.status(404).json({ error: "Employee not found" });
  }

  res.json(employee);
};


module.exports = { employeeLogin , getEmployeeProfile };