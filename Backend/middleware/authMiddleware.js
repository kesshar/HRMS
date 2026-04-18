// const jwt = require("jsonwebtoken");

// /*
// ==================================================
//    Protect Middleware (for both admin & employee)
// ==================================================
// */
// const protect = (req, res, next) => {
//   let token;

//   // Check Authorization header
//   if (
//     req.headers.authorization &&
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return res.status(401).json({ error: "Not authorized, no token" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     console.log('protect middleware: token present');
//     console.log('protect middleware: decoded payload ->', decoded);

//     // Attach decoded values to request (support different token payload shapes)
//     req.user = { id: decoded.id || decoded.userId };
//     // normalize role to uppercase so checks are case-insensitive
//     req.role = decoded.role ? decoded.role.toString().toUpperCase() : decoded.role;
//     // support both `orgId` and `organizationId` keys
//     req.organizationId = decoded.orgId || decoded.organizationId;

//     next();
//   } catch (error) {
//     return res.status(401).json({ error: "Token invalid or expired" });
//   }
// };

// /*
// ==================================================
//    Admin Only Middleware
// ==================================================
// */
// const adminOnly = (req, res, next) => {
//   if (req.role !== "admin") {
//     return res.status(403).json({ error: "Admin access only" });
//   }
//   next();
// };

// /*
// ==================================================
//    Employee Only Middleware
// ==================================================
// */
// const employeeOnly = (req, res, next) => {
//   if (req.role !== "EMPLOYEE") {
//     return res.status(403).json({ error: "Employee access only" });
//   }
//   next();
// };

// module.exports = {
//   protect,
//   adminOnly,
//   employeeOnly,
// };

const jwt = require("jsonwebtoken");

/*
==================================================
   Protect Middleware (for both admin & employee)
==================================================
*/
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "Psingh@12345";
    const decoded = jwt.verify(token, jwtSecret);

    console.log("protect middleware: token present");
    console.log("protect middleware: decoded payload ->", decoded);

    req.user = { id: decoded.id || decoded.userId };
    if (!req.user.id) {
       console.error("protect middleware: Token decoded but no id/userId found", decoded);
    }

    // Normalize role to uppercase and handle null/undefined
    req.role = decoded.role ? decoded.role.toString().toUpperCase() : undefined;

    // Search for organization ID in common keys
    req.organizationId = decoded.organizationId || decoded.orgId || decoded.organization;

    console.log("protect middleware: Assigned req.user.id ->", req.user.id);
    console.log("protect middleware: Assigned req.role ->", req.role);
    console.log("protect middleware: Assigned req.organizationId ->", req.organizationId);

    next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
};

/*
==================================================
   Admin Only Middleware
==================================================
*/
const adminOnly = (req, res, next) => {
  if (req.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/*
==================================================
   Employee Only Middleware
==================================================
*/
const employeeOnly = (req, res, next) => {
  if (req.role !== "EMPLOYEE") {
    return res.status(403).json({ error: "Employee access only" });
  }
  next();
};

module.exports = {
  protect,
  protectEmployee: protect,
  adminOnly,
  employeeOnly,
  protectAdmin: adminOnly
};