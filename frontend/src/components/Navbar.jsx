import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import API from "../services/api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap');

  .nb-root {
    position: sticky;
    top: 0;
    z-index: 50;
    font-family: 'DM Sans', sans-serif;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  }

  .nb-inner {
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .nb-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nb-brand-mark {
    width: 34px;
    height: 34px;
    background: #0f172a;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .nb-brand-mark svg {
    width: 16px;
    height: 16px;
    color: white;
  }

  .nb-greeting {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .nb-greeting-text {
    font-size: 13.5px;
    font-weight: 400;
    color: #64748b;
    letter-spacing: 0.01em;
    line-height: 1;
  }

  .nb-greeting-name {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 15px;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1;
    margin-top: 3px;
  }

  .nb-date-pill {
    display: none;
    font-size: 11.5px;
    font-weight: 400;
    color: #94a3b8;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    border-left: 1.5px solid #e2e8f0;
    padding-left: 12px;
    margin-left: 4px;
    line-height: 1.2;
  }

  @media (min-width: 640px) {
    .nb-date-pill { display: block; }
  }

  .nb-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nb-icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    transition: background 0.15s ease, color 0.15s ease;
    position: relative;
    flex-shrink: 0;
  }

  .nb-icon-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .nb-icon-btn svg {
    width: 17px;
    height: 17px;
  }

  .nb-notif-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 6px;
    height: 6px;
    background: #f43f5e;
    border-radius: 50%;
    border: 1.5px solid white;
  }

  .nb-divider {
    width: 1px;
    height: 22px;
    background: #e2e8f0;
    margin: 0 6px;
    flex-shrink: 0;
  }

  .nb-profile-btn {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 5px 5px 5px 5px;
    border-radius: 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .nb-profile-btn:hover {
    background: #f8fafc;
  }

  .nb-avatar-wrap {
    position: relative;
    flex-shrink: 0;
    width: 34px;
    height: 34px;
  }

  .nb-avatar-img {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    object-fit: cover;
    object-position: center;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    display: block;
  }

  .nb-avatar-initials {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: white;
    letter-spacing: 0.03em;
    border: 1.5px solid #e2e8f0;
    text-transform: uppercase;
  }

  .nb-status-dot {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    border: 1.5px solid white;
  }

  .nb-user-info {
    text-align: left;
    display: none;
  }

  @media (min-width: 768px) {
    .nb-user-info { display: block; }
  }

  .nb-user-name {
    font-size: 13.5px;
    font-weight: 500;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1;
    white-space: nowrap;
  }

  .nb-user-status {
    font-size: 11px;
    font-weight: 400;
    color: #10b981;
    letter-spacing: 0.02em;
    line-height: 1;
    margin-top: 3px;
  }

  .nb-chevron {
    width: 14px;
    height: 14px;
    color: #cbd5e1;
    transition: transform 0.2s ease, color 0.15s ease;
    display: none;
  }

  @media (min-width: 768px) {
    .nb-chevron { display: block; }
  }

  .nb-chevron.open {
    transform: rotate(180deg);
    color: #0f172a;
  }

  .nb-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 228px;
    background: white;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 14px;
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.1), 0 2px 8px rgba(15, 23, 42, 0.06);
    overflow: hidden;
    z-index: 100;
    animation: nb-drop 0.16s ease;
    transform-origin: top right;
  }

  @keyframes nb-drop {
    from { opacity: 0; transform: scale(0.96) translateY(-4px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .nb-dd-header {
    padding: 14px 16px 12px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .nb-dd-avatar {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: white;
    flex-shrink: 0;
  }

  .nb-dd-name {
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    color: #0f172a;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .nb-dd-email {
    font-size: 11.5px;
    font-weight: 400;
    color: #94a3b8;
    margin-top: 2px;
    line-height: 1;
  }

  .nb-dd-items {
    padding: 6px;
  }

  .nb-dd-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 9px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 400;
    color: #334155;
    letter-spacing: 0.005em;
    text-align: left;
    transition: background 0.12s ease, color 0.12s ease;
  }

  .nb-dd-item:hover {
    background: #f8fafc;
    color: #0f172a;
  }

  .nb-dd-item svg {
    width: 15px;
    height: 15px;
    color: #94a3b8;
    flex-shrink: 0;
    transition: color 0.12s ease;
  }

  .nb-dd-item:hover svg {
    color: #475569;
  }

  .nb-dd-sep {
    height: 1px;
    background: #f1f5f9;
    margin: 4px 6px;
  }

  .nb-dd-item.logout {
    color: #ef4444;
  }

  .nb-dd-item.logout:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  .nb-dd-item.logout svg {
    color: #fca5a5;
  }

  .nb-dd-item.logout:hover svg {
    color: #ef4444;
  }
`;

function Navbar() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("employeeToken");
  const baseURL = (API?.defaults?.baseURL || "").replace(/\/api\/?$/, "");

  const decodeJwt = (t) => {
    try {
      const parts = t.split(".");
      if (parts.length < 2) return null;
      let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = payload.length % 4;
      if (pad) payload += "=".repeat(4 - pad);
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const decoded = decodeJwt(token);
        if (!decoded) return;
        const role = decoded.role?.toUpperCase();
        if (["EMPLOYEE", "ADMIN", "HR"].includes(role)) {
          const res = await API.get("/auth/profile");
          setUser(res.data);
        }
      } catch (err) {
        if (err.response?.status === 401) localStorage.removeItem("employeeToken");
      }
    })();
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    ["employeeToken", "userRole", "userId"].forEach((k) => localStorage.removeItem(k));
    navigate("/");
  };

  const decoded = token ? decodeJwt(token) : null;
  const displayName = user?.name || decoded?.name || "Admin";
  const firstName = displayName.split(" ")[0];
  const initial = displayName.charAt(0).toUpperCase();
  const email = user?.email || decoded?.email || "employee@company.com";

  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const profilePath = user?.profilePic || user?.profileImage;
  const profileSrc = profilePath
    ? (/^(https?:|data:|blob:)/i.test(profilePath)
      ? profilePath
      : `${baseURL}${profilePath.startsWith("/") ? "" : "/"}${profilePath}`)
    : null;

  useEffect(() => {
    setProfileImageFailed(false);
  }, [profileSrc]);

  return (
    <>
      <style>{styles}</style>
      <nav className="nb-root">
        <div className="nb-inner">

          {/* Left — brand mark + greeting */}
          <div className="nb-brand">
            <div className="nb-brand-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <div className="nb-greeting">
              <span className="nb-greeting-text">Good {getGreeting()},</span>
              <span className="nb-greeting-name">{firstName}</span>
            </div>
            <span className="nb-date-pill">{dateStr}</span>
          </div>

          {/* Right — actions + profile */}
          <div className="nb-actions">

            {/* Search */}
            <button className="nb-icon-btn" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-5-5" />
              </svg>
            </button>

            {/* Notifications */}
            <button className="nb-icon-btn" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span className="nb-notif-dot" />
            </button>

            <span className="nb-divider" />

            {/* Profile */}
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                className="nb-profile-btn"
                onClick={() => setShowProfileMenu((p) => !p)}
                aria-haspopup="true"
                aria-expanded={showProfileMenu}
              >
                <div className="nb-avatar-wrap">
                  {profileSrc && !profileImageFailed ? (
                    <img
                      src={profileSrc}
                      alt={displayName}
                      className="nb-avatar-img"
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : (
                    <div className="nb-avatar-initials">{initial}</div>
                  )}
                  <span className="nb-status-dot" />
                </div>

                <div className="nb-user-info">
                  <p className="nb-user-name">{displayName}</p>
                  <p className="nb-user-status">● Online</p>
                </div>

                <svg className={`nb-chevron${showProfileMenu ? " open" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showProfileMenu && (
                <div className="nb-dropdown" role="menu">
                  {/* Header */}
                  <div className="nb-dd-header">
                    <div className="nb-dd-avatar">{initial}</div>
                    <div>
                      <p className="nb-dd-name">{displayName}</p>
                      <p className="nb-dd-email">{email}</p>
                    </div>
                  </div>

                  <div className="nb-dd-items">
                    {/* Profile */}
                    <button
                      className="nb-dd-item"
                      role="menuitem"
                      onClick={() => {
                        setShowProfileMenu(false);
                        const role = localStorage.getItem("userRole")?.toLowerCase();
                        navigate(role === "admin" || role === "hr" ? "/admin/dashboard" : "/employee/profile");
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      Your profile
                    </button>

                    {/* Settings */}
                    <button
                      className="nb-dd-item"
                      role="menuitem"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                      </svg>
                      Settings
                    </button>

                    <div className="nb-dd-sep" />

                    {/* Logout */}
                    <button className="nb-dd-item logout" role="menuitem" onClick={handleLogout}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export default Navbar;
