const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Organization = require("../models/Organization");

// Create test organization if needed
router.post("/create-test-org", async (req, res) => {
  try {
    let org = await Organization.findOne({ email: "testorg@test.com" });

    if (!org) {
      org = await Organization.create({
        companyName: "Test Organization",
        email: "testorg@test.com",
        password: "testorgpass123",
      });
    }

    res.json({
      message: "Test org ready",
      orgId: org._id,
      email: org.email,
    });
  } catch (err) {
    console.error("create-test-org error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create test employee
router.post("/create-test-employee", async (req, res) => {
  try {
    let org = await Organization.findOne({ email: "testorg@test.com" });

    if (!org) {
      org = await Organization.create({
        companyName: "Test Organization",
        email: "testorg@test.com",
        password: "testorgpass123",
      });
    }

    let emp = await Employee.findOne({ email: "testemployee@test.com" });

    if (!emp) {
      emp = await Employee.create({
        organizationId: org._id,
        name: "Test Employee",
        email: "testemployee@test.com",
        password: "testemppass123",
        role: "EMPLOYEE",
        department: "Engineering",
        skills: ["Node.js", "React"],
        isActive: true,
      });

      console.log("Created test employee with ID:", emp._id);
    } else {
      // Update role to uppercase if needed
      if (emp.role !== "EMPLOYEE") {
        emp.role = "EMPLOYEE";
        await emp.save();
        console.log("Updated test employee role to EMPLOYEE");
      }
    }

    res.json({
      message: "Test employee ready",
      empId: emp._id,
      email: emp.email,
      name: emp.name,
      role: emp.role,
      loginUrl: "http://localhost:3000/employee-login",
      testPayload: {
        email: "testemployee@test.com",
        password: "testemppass123",
      },
    });
  } catch (err) {
    console.error("create-test-employee error:", err);
    res.status(500).json({ error: err.message });
  }
});

// List all employees
router.get("/list-employees", async (req, res) => {
  try {
    const employees = await Employee.find().select(
      "_id name email password isActive organizationId"
    );

    res.json({
      count: employees.length,
      employees: employees.map((e) => ({
        _id: e._id,
        name: e.name,
        email: e.email,
        isActive: e.isActive,
        orgId: e.organizationId,
        passwordExists: !!e.password,
      })),
    });
  } catch (err) {
    console.error("list-employees error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
