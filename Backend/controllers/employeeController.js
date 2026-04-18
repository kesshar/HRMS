// // const Employee = require("../models/Employee");

// // // Add Employee (Admin Only)
// // const addEmployee = async (req, res) => {
// //   const { name, email, password, role, department, skills, walletAddress } =
// //     req.body;

// //   if (!name || !email || !password) {
// //     res.status(400);
// //     throw new Error("Name, email, and password are required");
// //   }

// //   const employeeExists = await Employee.findOne({ email });

// //   if (employeeExists) {
// //     res.status(400);
// //     throw new Error("Employee already exists with this email");
// //   }

// //   const employee = await Employee.create({
// //     organizationId: req.organizationId,
// //     name,
// //     email,
// //     password,
// //     role,
// //     department,
// //     skills: skills || [],
// //     walletAddress: walletAddress || "",
// //   });

// //   res.status(201).json(employee);
// // };

// // // Get All Employees (Admin Only)
// // const getEmployees = async (req, res) => {
// //   const employees = await Employee.find({ organizationId: req.organizationId })
// //     .select("-password")
// //     .sort({ createdAt: -1 });

// //   res.json(employees);
// // };

// // // Get Single Employee
// // const getEmployeeById = async (req, res) => {
// //   const employee = await Employee.findById(req.params.id).select("-password");

// //   if (!employee) {
// //     res.status(404);
// //     throw new Error("Employee not found");
// //   }

// //   res.json(employee);
// // };

// // // Update Employee
// // const updateEmployee = async (req, res) => {
// //   const employee = await Employee.findById(req.params.id);

// //   if (!employee) {
// //     res.status(404);
// //     throw new Error("Employee not found");
// //   }

// //   if (employee.organizationId.toString() !== req.organizationId.toString()) {
// //     res.status(403);
// //     throw new Error("Not allowed to update this employee");
// //   }

// //   employee.name = req.body.name || employee.name;
// //   employee.email = req.body.email || employee.email;
// //   employee.role = req.body.role || employee.role;
// //   employee.department = req.body.department || employee.department;
// //   employee.skills = req.body.skills || employee.skills;
// //   employee.walletAddress = req.body.walletAddress || employee.walletAddress;
// //   employee.isActive =
// //     req.body.isActive !== undefined ? req.body.isActive : employee.isActive;

// //   const updatedEmployee = await employee.save();

// //   res.json(updatedEmployee);
// // };

// // // Delete Employee
// // const deleteEmployee = async (req, res) => {
// //   const employee = await Employee.findById(req.params.id);

// //   if (!employee) {
// //     res.status(404);
// //     throw new Error("Employee not found");
// //   }

// //   if (employee.organizationId.toString() !== req.organizationId.toString()) {
// //     res.status(403);
// //     throw new Error("Not allowed to delete this employee");
// //   }

// //   await employee.deleteOne();

// //   res.json({ message: "Employee deleted successfully" });
// // };

// // module.exports = {
// //   addEmployee,
// //   getEmployees,
// //   getEmployeeById,
// //   updateEmployee,
// //   deleteEmployee,
// // };

// const Employee = require("../models/Employee");

// // Add Employee (Admin Only)
// const addEmployee = async (req, res) => {
//   try {
//     const { name, email, password, role, department, skills, walletAddress } =
//       req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({
//         error: "Name, email, and password are required",
//       });
//     }

//     const employeeExists = await Employee.findOne({ email });

//     if (employeeExists) {
//       return res.status(400).json({
//         error: "Employee already exists with this email",
//       });
//     }

//     const employee = await Employee.create({
//       organizationId: req.organizationId,
//       name,
//       email,
//       password,
//       role,
//       department,
//       skills: skills || [],
//       walletAddress: walletAddress || "",
//     });

//     res.status(201).json(employee);
//   } catch (error) {
//     console.error("Add Employee Error:", error.message);
//     res.status(500).json({ error: "Server error" });
//   }
// };

const Employee = require("../models/Employee");

/*
==================================================
   Add Employee (Admin Only)
==================================================
*/
const addEmployee = async (req, res) => {
  console.log("addEmployee: req.body ->", req.body);
  console.log("addEmployee: req.organizationId ->", req.organizationId);
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      skills,
      walletAddress,
    } = req.body;

    if (!name || !email || !password || !role || !department) {
      return res.status(400).json({
        error: "Name, email, password, role and department are required",
      });
    }

    const employeeExists = await Employee.findOne({ email });

    if (employeeExists) {
      return res.status(400).json({
        error: "Employee already exists with this email",
      });
    }

    const employee = await Employee.create({
      organizationId: req.organizationId,
      name,
      email,
      password,
      role,
      department,
      skills: skills || [],
      walletAddress: walletAddress || "",
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error("Add Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/*
==================================================
   Get All Employees (Admin Only)
==================================================
*/
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({
      organizationId: req.organizationId,
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error("Get Employees Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/*
==================================================
   Get Single Employee
==================================================
*/
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select(
      "-password"
    );

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (
      employee.organizationId.toString() !==
      req.organizationId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not allowed to view this employee" });
    }

    res.json(employee);
  } catch (error) {
    console.error("Get Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/*
==================================================
   Update Employee
==================================================
*/
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (
      employee.organizationId.toString() !==
      req.organizationId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not allowed to update this employee" });
    }

    employee.name = req.body.name || employee.name;
    employee.email = req.body.email || employee.email;
    employee.role = req.body.role || employee.role;
    employee.department = req.body.department || employee.department;
    employee.skills = req.body.skills || employee.skills;
    employee.walletAddress =
      req.body.walletAddress || employee.walletAddress;
    employee.isActive =
      req.body.isActive !== undefined
        ? req.body.isActive
        : employee.isActive;

    const updatedEmployee = await employee.save();

    res.json(updatedEmployee);
  } catch (error) {
    console.error("Update Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/*
==================================================
   Delete Employee
==================================================
*/
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    if (
      employee.organizationId.toString() !==
      req.organizationId.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not allowed to delete this employee" });
    }

    await employee.deleteOne();

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete Employee Error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

/*
==================================================
   Export All Controllers
==================================================
*/
module.exports = {
  addEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};