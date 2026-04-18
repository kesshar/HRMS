import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export function AdminLayout() {
  return (
    <div style={{ display: "flex", backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <Sidebar prefix="/admin" />

      <div style={{ flex: 1, height: "100vh", overflow: "auto" }}>
        <Navbar />
        <div style={{ padding: "32px" }}><Outlet /></div>
      </div>
    </div>
  );
}

export function EmployeeLayout() {
  return (
    <div style={{ display: "flex", backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <Sidebar prefix="/employee" isEmployee={true} />

      <div style={{ flex: 1, height: "100vh", overflow: "auto" }}>
        <Navbar />
        <div style={{ padding: "0px" }}><Outlet /></div>
      </div>
    </div>
  );
}
