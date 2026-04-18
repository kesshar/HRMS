import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import RegisterOrganization from "./pages/RegisterOrganization";
import AdminLogin from "./pages/AdminLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import Dashboard from "./pages/Dashboard";
import { AdminLayout, EmployeeLayout } from "./components/Layout";
import Employees from "./pages/Employees";
import EditEmployee from "./pages/EditEmployee";
import AddEmployee from "./pages/AddEmployee";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Tasks from "./pages/Tasks";
import AssignTask from "./pages/AssignTask";
import EmployeeProfile from "./pages/EmployeeProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import Features from "./pages/Features";
import Solutions from "./pages/Solution";
import Pricing from "./pages/Pricing";
import Resources from "./pages/Resources";
import Chat from "./pages/Chat";
import Reports from "./pages/Reports";
import Attendance from "./pages/Attendance";
import Leaderboard from "./pages/Leaderboard";
import Meetings from "./pages/Meetings";
import MeetingRoom from "./pages/MeetingRoom";
import QRAttendance from "./pages/QRAttendance";
import TeamProgress from "./pages/TeamProgress";
import EmployeeGroups from "./pages/EmployeeGroups";
import AdminLeaves from "./pages/AdminLeaves";
import EmployeeLeaves from "./pages/EmployeeLeaves";
import AdminPayroll from "./pages/AdminPayroll";
import EmployeePayroll from "./pages/EmployeePayroll";

function App() {
  const userRole = localStorage.getItem("userRole")?.toLowerCase() || '';
  const token = localStorage.getItem("employeeToken");

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register-org" element={<RegisterOrganization />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/employee-login" element={<EmployeeLogin />} />

        {/* Features & Pages */}
        <Route path="/features" element={<Features />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/resources" element={<Resources />} />

        {/* Compatibility Redirects */}
        <Route path="/dashboard" element={<Navigate to={userRole === 'admin' || userRole === 'hr' ? '/admin/dashboard' : '/employee/dashboard'} replace />} />
        <Route path="/employee-dashboard" element={<Navigate to="/employee/dashboard" replace />} />
        <Route path="/reports" element={<Navigate to={userRole === 'admin' || userRole === 'hr' ? '/admin/reports' : '/employee/report-abuse'} replace />} />
        <Route path="/employees" element={<Navigate to="/admin/employees" replace />} />
        <Route path="/tasks" element={<Navigate to="/admin/tasks" replace />} />

        {/* Meeting Rooms */}
        <Route
          path="/admin/meeting-room/:meetingId"
          element={<ProtectedRoute role="admin"><MeetingRoom /></ProtectedRoute>}
        />
        <Route
          path="/employee/meeting-room/:meetingId"
          element={<ProtectedRoute role="employee"><MeetingRoom /></ProtectedRoute>}
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="edit-employee/:id" element={<EditEmployee />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="assign-task" element={<AssignTask />} />
          <Route path="team-progress" element={<TeamProgress />} />
          <Route path="chat" element={<Chat />} />
          <Route path="reports" element={<Reports />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="qr-attendance" element={<QRAttendance />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="leaves" element={<AdminLeaves />} />
          <Route path="payroll" element={<AdminPayroll />} />
        </Route>

        {/* Employee Routes */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="profile" element={<EmployeeProfile />} />
          <Route path="groups" element={<EmployeeGroups />} />
          <Route path="chat" element={<Chat />} />
          <Route path="report-abuse" element={<Reports />} />
          <Route path="qr-attendance" element={<QRAttendance />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="leaves" element={<EmployeeLeaves />} />
          <Route path="payroll" element={<EmployeePayroll />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;