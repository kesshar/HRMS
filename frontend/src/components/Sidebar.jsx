import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap');

  .sb-root {
    font-family: 'DM Sans', sans-serif;
  }

  .sb-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.25);
    backdrop-filter: blur(4px);
    z-index: 20;
  }

  .sb-aside {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 30;
    width: 252px;
    background: #ffffff;
    border-right: 1px solid rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @media (min-width: 1024px) {
    .sb-aside {
      position: static;
      height: 100vh;
      transform: none !important;
    }
  }

  .sb-aside.hidden {
    transform: translateX(-100%);
  }

  /* Header */
  .sb-header {
    padding: 20px 20px 16px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sb-brand {
    display: flex;
    align-items: center;
    gap: 11px;
  }

  .sb-logo-mark {
    width: 36px;
    height: 36px;
    background: #0f172a;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sb-logo-mark svg {
    width: 17px;
    height: 17px;
    color: white;
  }

  .sb-brand-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .sb-brand-name {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 16px;
    color: #0f172a;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .sb-brand-role {
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94a3b8;
    line-height: 1;
    margin-top: 3px;
  }

  .sb-close-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    transition: background 0.12s ease, color 0.12s ease;
  }

  .sb-close-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .sb-close-btn svg {
    width: 15px;
    height: 15px;
  }

  /* Nav section label */
  .sb-nav {
    flex: 1;
    padding: 16px 12px;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .sb-nav::-webkit-scrollbar { display: none; }

  .sb-section-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #cbd5e1;
    padding: 0 8px;
    margin-bottom: 6px;
    margin-top: 4px;
  }

  .sb-nav-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* Nav item */
  .sb-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.12s ease, color 0.12s ease;
    position: relative;
    cursor: pointer;
  }

  .sb-link.active {
    background: #0f172a;
  }

  .sb-link.inactive {
    background: transparent;
  }

  .sb-link.inactive:hover {
    background: #f8fafc;
  }

  .sb-icon-wrap {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.12s ease;
  }

  .sb-link.active .sb-icon-wrap {
    background: rgba(255, 255, 255, 0.12);
  }

  .sb-link.inactive .sb-icon-wrap {
    background: transparent;
  }

  .sb-link.inactive:hover .sb-icon-wrap {
    background: #f1f5f9;
  }

  .sb-icon-wrap svg {
    width: 16px;
    height: 16px;
  }

  .sb-link.active .sb-icon-wrap svg {
    color: rgba(255, 255, 255, 0.9);
  }

  .sb-link.inactive .sb-icon-wrap svg {
    color: #94a3b8;
  }

  .sb-link.inactive:hover .sb-icon-wrap svg {
    color: #475569;
  }

  .sb-link-label {
    font-size: 13.5px;
    font-weight: 400;
    letter-spacing: 0.005em;
    flex: 1;
    transition: color 0.12s ease;
  }

  .sb-link.active .sb-link-label {
    color: #ffffff;
    font-weight: 500;
  }

  .sb-link.inactive .sb-link-label {
    color: #475569;
  }

  .sb-link.inactive:hover .sb-link-label {
    color: #0f172a;
  }

  .sb-active-pip {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    flex-shrink: 0;
  }

  /* Separator */
  .sb-sep {
    height: 1px;
    background: rgba(15, 23, 42, 0.05);
    margin: 10px 8px;
  }

  /* Status widget */
  .sb-status-widget {
    margin: 4px 0 0;
    padding: 10px 12px;
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid rgba(15, 23, 42, 0.05);
  }

  .sb-status-label {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: #cbd5e1;
    margin-bottom: 7px;
  }

  .sb-status-row {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .sb-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    flex-shrink: 0;
  }

  .sb-status-text {
    font-size: 12px;
    color: #64748b;
    font-weight: 400;
  }

  /* Footer */
  .sb-footer {
    padding: 12px;
    border-top: 1px solid rgba(15, 23, 42, 0.06);
  }

  .sb-footer-inner {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #f8fafc;
  }

  .sb-footer-avatar {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    color: white;
    flex-shrink: 0;
    font-family: 'DM Sans', sans-serif;
  }

  .sb-footer-name {
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sb-footer-email {
    font-size: 11px;
    font-weight: 400;
    color: #94a3b8;
    line-height: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  /* Mobile FAB */
  .sb-fab {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 20;
    width: 44px;
    height: 44px;
    background: #0f172a;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.2);
    transition: background 0.15s ease, transform 0.15s ease;
  }

  .sb-fab:hover {
    background: #1e293b;
    transform: scale(1.05);
  }

  .sb-fab svg {
    width: 18px;
    height: 18px;
    color: white;
  }

  @media (min-width: 1024px) {
    .sb-fab { display: none; }
    .sb-overlay { display: none; }
    .sb-close-btn { display: none; }
  }
`;

function Sidebar({ prefix = "/admin", isEmployee = false }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) =>
    location.pathname === `${prefix}${path}` || location.pathname === path;

  const adminLinks = [
    { path: "/dashboard", label: "Dashboard", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/employees", label: "Employees", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { path: "/tasks", label: "Tasks", d: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { path: "/payroll", label: "Payroll Manager", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { path: "/team-progress", label: "Team Progress", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { path: "/chat", label: "Chat", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { path: "/reports", label: "Reports", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { path: "/leaves", label: "Leave Manager", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { path: "/qr-attendance", label: "QR Attendance", d: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0z" },
    { path: "/leaderboard", label: "Leaderboard", d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { path: "/meetings", label: "Video Meetings", d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  ];

  const employeeLinks = [
    { path: "/dashboard", label: "Dashboard", d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { path: "/groups", label: "Group Projects", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
    { path: "/payroll", label: "Payslips", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { path: "/chat", label: "Team Chat", d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { path: "/leaves", label: "My Leaves", d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { path: "/report-abuse", label: "Report Issue", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
    { path: "/qr-attendance", label: "QR Attendance", d: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0z" },
    { path: "/meetings", label: "Video Meetings", d: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" },
  ];

  const links = isEmployee ? employeeLinks : adminLinks;

  return (
    <div className="sb-root">
      <style>{styles}</style>

      {/* Mobile overlay */}
      {!collapsed && (
        <div className="sb-overlay lg:hidden" onClick={() => setCollapsed(true)} />
      )}

      {/* Sidebar */}
      <aside className={`sb-aside${collapsed ? " hidden" : ""}`}>

        {/* Header */}
        <div className="sb-header">
          <div className="sb-brand">
            <div className="sb-logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div className="sb-brand-text">
              <span className="sb-brand-name">Zenith HR</span>
              <span className="sb-brand-role">{isEmployee ? "Employee" : "HRMS"}</span>
            </div>
          </div>
          <button className="sb-close-btn lg:hidden" onClick={() => setCollapsed(true)} aria-label="Close sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="sb-nav">
          <p className="sb-section-label">Navigation</p>
          <div className="sb-nav-list">
            {links.map((link, i) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={`${prefix}${link.path}`}
                  className={`sb-link ${active ? "active" : "inactive"}`}
                  onClick={() => setCollapsed(true)}
                >
                  <div className="sb-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={link.d} />
                    </svg>
                  </div>
                  <span className="sb-link-label">{link.label}</span>
                  {active && <span className="sb-active-pip" />}
                </Link>
              );
            })}
          </div>

          <div className="sb-sep" />

          {/* Status widget */}
          <div className="sb-status-widget">
            <p className="sb-status-label">System Status</p>
            <div className="sb-status-row">
              <span className="sb-status-dot" />
              <span className="sb-status-text">All systems operational</span>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="sb-footer">
          <div className="sb-footer-inner">
            <div className="sb-footer-avatar">A</div>
            <div style={{ minWidth: 0 }}>
              <p className="sb-footer-name">Admin User</p>
              <p className="sb-footer-email">admin@company.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile FAB */}
      {collapsed && (
        <button className="sb-fab" onClick={() => setCollapsed(false)} aria-label="Open sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Sidebar;