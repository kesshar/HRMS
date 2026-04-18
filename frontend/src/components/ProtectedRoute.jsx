import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, role }) {
  const token = localStorage.getItem("employeeToken");
  const userRole = localStorage.getItem("userRole")?.toLowerCase() || "";

  if (!token) {
    return <Navigate to="/" replace />;
  }
  
  // Logic: 
  // If route is for admin, user MUST be admin.
  // If route is for employee, user MUST NOT be admin (or simply allow any authenticated non-admin).
  
  if (role === "admin") {
    if (userRole !== "admin" && userRole !== "hr") {
      return <Navigate to="/employee/dashboard" replace />;
    }
  }

  if (role === "employee") {
    if (userRole === "admin" || userRole === "hr") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
