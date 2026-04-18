import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import QRCodeLib from 'qrcode';
import API from '../services/api';

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000, r = d => (d * Math.PI) / 180;
  const a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════
//  HR PANEL – generate QR + date-wise attendance viewer
// ═══════════════════════════════════════════════════════
function HRQRPanel() {
  const [session, setSession] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateRecords, setDateRecords] = useState({});
  const [expandedDate, setExpandedDate] = useState(null);
  const [recentDates] = useState(() =>
    Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'))
  );
  const [dateLoading, setDateLoading] = useState(false);
  const canvasRef = useRef(null);
  const autoRef = useRef(null);
  const tickRef = useRef(null);

  const stopQR = useCallback(() => {
    clearInterval(autoRef.current);
    clearInterval(tickRef.current);
    setSession(null);
    setCountdown(0);
  }, []);

  const generateQR = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.post('/attendance/qr/generate');
      setSession(res.data);
      setCountdown(60);
    } catch (err) {
      alert('Failed to generate QR: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  }, []);

  // Draw QR on canvas
  useEffect(() => {
    if (!session || !canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, JSON.stringify({
      sessionId: session.sessionId, timestamp: session.timestamp, expiresAt: session.expiresAt
    }), { width: 280, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } }).catch(() => { });
  }, [session]);

  // Removed auto-refresh every 60 s as requested

  // Countdown tick
  useEffect(() => {
    clearInterval(tickRef.current);
    if (!session) return;
    tickRef.current = setInterval(() => setCountdown(c => {
      if (c <= 1) {
        clearInterval(tickRef.current);
        // Automatically stop the session when time runs out
        // This ensures the QR disappears and no new one is auto-generated
        stopQR();
        return 0;
      }
      return c - 1;
    }), 1000);
    return () => clearInterval(tickRef.current);
  }, [session, stopQR]);

  const loadDate = async (date) => {
    if (expandedDate === date) { setExpandedDate(null); return; }
    setExpandedDate(date);
    if (dateRecords[date]) return;
    try {
      setDateLoading(true);
      const res = await API.get(`/attendance/date/${date}`);
      setDateRecords(prev => ({ ...prev, [date]: res.data }));
    } catch (e) {/* silent */ } finally { setDateLoading(false); }
  };

  const pct = (countdown / 60) * 100;
  const col = countdown > 20 ? '#10b981' : countdown > 10 ? '#f59e0b' : '#ef4444';

  return (
    <div className="hr-root">
      <style>{hrCSS}</style>

      {/* QR Card */}
      <div className="qr-card">
        <div className="qr-card-hdr">
          <div className="qr-icon-box">
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 className="qr-card-ttl">QR Attendance Generator</h2>
            <p className="qr-card-sub">Generate a 60-second QR for employees to mark attendance</p>
          </div>
          {session && (
            <button className="stop-btn" onClick={stopQR}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
              </svg>
              Stop QR
            </button>
          )}
        </div>

        {!session ? (
          <div className="empty-state">
            <div className="qr-placeholder">
              <svg width="56" height="56" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1" stroke="#cbd5e1" strokeWidth="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1" stroke="#cbd5e1" strokeWidth="1.5" />
                <path d="M14 14h3M14 17h.01M17 17h3M20 14v3M14 20h6" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>No active QR session</p>
            </div>
            <button id="generate-qr-btn" className="gen-btn" onClick={generateQR} disabled={loading}>
              {loading ? <><span className="spin" /> Generating…</> : '✦ Generate Attendance QR'}
            </button>
          </div>
        ) : (
          <div className="active-state">
            <div className="ring-wrap">
              <svg viewBox="0 0 120 120" width="310" height="310" style={{ position: 'absolute', top: -15, left: -15 }}>
                <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={col} strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dashoffset 0.5s, stroke 0.5s' }}
                />
              </svg>
              <canvas ref={canvasRef} style={{ borderRadius: 12, display: 'block' }} />
            </div>
            <div className="qr-meta">
              <span className="qr-timer" style={{ color: col }}>⏱ {countdown}s</span>
              <span className="qr-sid">Session: {session.sessionId.slice(0, 8)}…</span>
            </div>
            <div className="btn-row">
              <button className="gen-btn refresh-btn" onClick={generateQR} disabled={loading}>
                {loading ? <><span className="spin" /> Refreshing…</> : '↻ New QR'}
              </button>
              <button className="gen-btn stop-inline-btn" onClick={stopQR}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
                </svg>
                Stop QR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Date-wise Attendance */}
      <div className="date-panel">
        <h3 className="panel-ttl">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Attendance by Date (Last 7 Days)
        </h3>
        {recentDates.map(date => {
          const rec = dateRecords[date];
          const open = expandedDate === date;
          return (
            <div key={date} className="date-item">
              <button className={`date-tog ${open ? 'date-tog-on' : ''}`} onClick={() => loadDate(date)}>
                <span className="date-lbl">
                  {format(new Date(date + 'T00:00:00'), 'EEEE, MMM d')}
                  {date === format(new Date(), 'yyyy-MM-dd') && <span className="today-pill">Today</span>}
                </span>
                {rec && (
                  <span className="date-stats">
                    <span className="sp">✓ {rec.present?.length || 0}</span>
                    <span className="sa">✗ {rec.absent?.length || 0}</span>
                  </span>
                )}
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open && (
                <div className="date-detail">
                  {dateLoading && !rec ? <p className="loading-txt">Loading…</p> : rec ? (
                    <div className="detail-cols">
                      {[['present', rec.present], ['absent', rec.absent]].map(([type, list]) => (
                        <div key={type} className="detail-col">
                          <h4 className={`col-ttl col-${type}`}>
                            <span className={`dot dot-${type}`} />
                            {type.charAt(0).toUpperCase() + type.slice(1)} ({list?.length || 0})
                          </h4>
                          {list?.length > 0 ? list.map((e, i) => (
                            <div key={i} className="emp-row">
                              <div className={`avatar avatar-${type}`}>{e.employee?.name?.[0]?.toUpperCase() || '?'}</div>
                              <div>
                                <p className="emp-name">{e.employee?.name || 'Unknown'}</p>
                                <p className="emp-time">{type === 'present' && e.checkInTime
                                  ? `In ${format(new Date(e.checkInTime), 'HH:mm')}` : 'Not marked'}</p>
                              </div>
                            </div>
                          )) : <p className="no-data">{type === 'present' ? 'No employees present' : 'All present! 🎉'}</p>}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  EMPLOYEE PANEL – shows live HR QR + mark attendance
// ═══════════════════════════════════════════════════════
function EmployeeQRPanel() {
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [qrSession, setQrSession] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [marking, setMarking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  const [isMobile, setIsMobile] = useState(true);
  const [todaySummary, setTodaySummary] = useState(null);
  const canvasRef = useRef(null);
  const scannerBoxRef = useRef(null);
  const html5Ref = useRef(null);
  const pollRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    fetchToday();
    fetchHistory();
    fetchQR();
    fetchTodayList();
    pollRef.current = setInterval(() => { fetchQR(); fetchTodayList(); }, 15000);
    return () => { clearInterval(pollRef.current); clearInterval(tickRef.current); };
  }, []);

  const fetchToday = async () => {
    try { const r = await API.get('/attendance/today'); setTodayStatus(r.data); } catch { }
  };

  const fetchHistory = async () => {
    try { const r = await API.get('/attendance/my-attendance?limit=20'); setHistory(r.data.attendance || []); } catch { }
  };

  const fetchTodayList = async () => {
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const r = await API.get(`/attendance/date/${dateStr}`);
      setTodaySummary(r.data);
    } catch { }
  };

  const fetchQR = async () => {
    try {
      const r = await API.get('/attendance/qr/current');
      const s = r.data;
      setQrSession(s);
      const rem = Math.max(0, Math.round((new Date(s.expiresAt) - Date.now()) / 1000));
      setCountdown(rem);
      clearInterval(tickRef.current);
      tickRef.current = setInterval(() =>
        setCountdown(c => { if (c <= 1) { clearInterval(tickRef.current); return 0; } return c - 1; }), 1000);
    } catch {
      setQrSession(null); setCountdown(0); clearInterval(tickRef.current);
    }
  };

  // Draw QR when session arrives
  useEffect(() => {
    if (!qrSession || !canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, JSON.stringify({
      sessionId: qrSession.sessionId, timestamp: qrSession.timestamp, expiresAt: qrSession.expiresAt
    }), { width: 220, margin: 1, color: { dark: '#1e293b', light: '#ffffff' } }).catch(() => { });
  }, [qrSession]);

  const showToast = (type, text) => { setToast({ type, text }); setTimeout(() => setToast(null), 7000); };

  // Helper for actual marking (extracted for reuse if needed)
  const submitMark = async (sessionId, lat, lon) => {
    try {
      setMarking(true);
      const res = await API.post('/attendance/qr/mark', { sessionId, latitude: lat, longitude: lon });
      showToast('success', '✅ Attendance marked successfully!');
      fetchToday(); fetchHistory(); fetchTodayList();
      return true;
    } catch (err) {
      showToast('error', '❌ ' + (err.response?.data?.message || 'Failed to mark attendance.'));
      return false;
    } finally { setMarking(false); }
  };

  const handleMarkPresent = useCallback(async () => {
    if (!qrSession) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        await submitMark(qrSession.sessionId, latitude, longitude);
      },
      (err) => {
        setLocating(false);
        showToast('error', '📍 Location access required for attendance.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [qrSession]);



  // Camera scan logic
  const startScan = async () => {
    if (!isMobile) {
      showToast('error', 'Please use mobile device to scan QR.');
      return;
    }
    setScanning(true); setScanMsg('Initializing camera…');
    await new Promise(r => setTimeout(r, 300));
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      html5Ref.current = new Html5Qrcode('emp-qr-reader');
      await html5Ref.current.start(
        { facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } },
        async text => {
          // Success Callback
          let p; try { p = JSON.parse(text); } catch { showToast('error', 'Invalid QR Code.'); return; }
          const age = (Date.now() - new Date(p.timestamp).getTime()) / 1000;
          if (age > 65) { showToast('error', '⏰ Scanned QR has expired.'); return; }

          await stopScan(); // Stop camera once detected

          setLocating(true);
          navigator.geolocation.getCurrentPosition(async pos => {
            setLocating(false);
            const { latitude, longitude } = pos.coords;
            const dist = haversine(latitude, longitude, OFFICE_LAT, OFFICE_LON);
            if (dist > MAX_DIST_M) {
              showToast('error', `📍 Too far! You are ${Math.round(dist)}m away from office.`);
              return;
            }
            await submitMark(p.sessionId, latitude, longitude);
          }, (err) => {
            setLocating(false);
            showToast('error', '📍 Location access required for attendance.');
          }, { enableHighAccuracy: true, timeout: 10000 });
        },
        () => { } // silent scan
      );
      setScanMsg('Align QR code within the frame');
    } catch (err) { setScanMsg('Camera error: ' + err.message); }
  };


  const stopScan = async () => {
    try { if (html5Ref.current) { await html5Ref.current.stop(); html5Ref.current = null; } } catch { }
    setScanning(false); setScanMsg('');
  };

  const isPresent = !!todayStatus?.checkIn;
  const pct = (countdown / 60) * 100;
  const col = countdown > 20 ? '#10b981' : countdown > 10 ? '#f59e0b' : '#ef4444';

  return (
    <div className="emp-root">
      <style>{empCSS}</style>

      {toast && (
        <div className={`e-toast ${toast.type === 'success' ? 'toast-ok' : 'toast-err'}`}>{toast.text}</div>
      )}

      {/* Status banner */}
      <div className={`status-card ${isPresent ? 's-present' : 's-absent'}`}>
        <div className="s-icon">
          {isPresent
            ? <svg width="30" height="30" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            : <svg width="30" height="30" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          }
        </div>
        <div>
          <p className="s-label">Today's Status</p>
          <p className="s-value">{isPresent ? 'Present' : 'Absent'}</p>
          {isPresent && todayStatus?.checkIn?.time && (
            <p className="s-time">Checked in at {format(new Date(todayStatus.checkIn.time), 'hh:mm a')}</p>
          )}
        </div>
      </div>

      {/* Live QR card */}
      {!isPresent && (
        <div className="live-card">
          {/* Header */}
          <div className="live-hdr">
            <div className="live-hdr-icon">
              <svg width="17" height="17" fill="none" stroke="white" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p className="live-ttl">QR Scan Required</p>
              <p className="live-sub">Scan the QR code displayed on HR's screen</p>
            </div>
            {qrSession && (
              <div className="countdown-pill" style={{ color: col, borderColor: col }}>
                ● Active Now
              </div>
            )}
          </div>

          {/* Body */}
          <div className="live-body">
            {!isMobile ? (
              <div className="no-mobile">
                <div className="no-qr-circle" style={{ background: '#fff1f2' }}>
                  <svg width="36" height="36" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18l12-12" />
                  </svg>
                </div>
                <p className="no-qr-t" style={{ color: '#dc2626' }}>Scan Only on Mobile</p>
                <p className="no-qr-s">Security policy requires attendance to be marked via mobile device scanning.</p>
              </div>
            ) : !qrSession ? (
              <div className="no-qr">
                <div className="no-qr-circle">
                  <svg width="36" height="36" fill="none" stroke="#cbd5e1" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="#cbd5e1" strokeWidth="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="#cbd5e1" strokeWidth="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M14 14h3M14 17h.01M17 17h3M20 14v3M14 20h6" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="no-qr-t">Session Inactive</p>
                <p className="no-qr-s">HR hasn't started the attendance session. Please wait.</p>
                <button className="recheck-btn" onClick={() => { fetchQR(); fetchTodayList(); }}>↻ Refresh Status</button>
              </div>
            ) : (
              <div className="scan-main">
                <div className="scan-info">
                  <h3 className="act-ttl">Daily Attendance Session</h3>
                  <p className="act-desc">
                    Mark your attendance by clicking the button below or scanning the HR's QR code.
                  </p>
                </div>

                <div className="active-qr-display" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <canvas ref={canvasRef} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: '180px', height: '180px' }} />
                </div>

                <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <button className="mark-btn" onClick={handleMarkPresent} disabled={locating || marking || countdown <= 0}>
                    {locating ? <><span className="spin" /> Checking GPS…</>
                      : marking ? <><span className="spin" /> Recording…</>
                        : countdown <= 0 ? '⏰ Session Expired'
                          : <><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg> Mark as Present</>
                    }
                  </button>

                  {!scanning ? (
                    <button className="recheck-btn" onClick={startScan} style={{ width: '100%', margin: 0, padding: '12px', borderRadius: '16px' }}>
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m10-14h4a2 2 0 012 2v4m-6 10h4a2 2 0 002-2v-4" />
                      </svg>
                      Open Camera Scanner
                    </button>
                  ) : (
                    <div className="cam-container">
                      <div className="cam-header">
                        <p className="scan-msg">{scanMsg}</p>
                        <button className="cam-cancel" onClick={stopScan}>✕ Close Camera</button>
                      </div>
                      <div id="emp-qr-reader" ref={scannerBoxRef} className="scan-box" />
                    </div>
                  )}
                </div>

                {/* Today's Attendance List for Employees */}
                {todaySummary && (
                  <div className="today-summary-card" style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Today's Presence</h4>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', fontWeight: 600 }}>
                        <span style={{ color: '#059669' }}>✓ {todaySummary.present?.length || 0}</span>
                        <span style={{ color: '#dc2626' }}>✗ {todaySummary.absent?.length || 0}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {todaySummary.present?.length > 0 ? todaySummary.present.map((e, idx) => (
                        <div key={idx} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>
                            {e.employee?.name?.[0].toUpperCase()}
                          </div>
                          <span style={{ fontSize: '10px', color: '#64748b', maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.employee?.name.split(' ')[0]}</span>
                        </div>
                      )) : <p style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0' }}>No one checked in yet</p>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}


      {isPresent && (
        <div className="marked-banner">
          <svg width="18" height="18" fill="none" stroke="#059669" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Attendance successfully marked for today ✓
        </div>
      )}

      {/* History */}
      <div className="hist-card">
        <h3 className="hist-ttl">Past Attendance (Last 20 Days)</h3>
        <div className="hist-list">
          {history.length === 0
            ? <p className="no-hist">No attendance records found.</p>
            : history.map(rec => (
              <div key={rec._id} className="hist-row">
                <div className="hist-date">
                  <p className="h-day">{rec.date ? format(new Date(rec.date), 'EEE') : '--'}</p>
                  <p className="h-full">{rec.date ? format(new Date(rec.date), 'MMM d, yyyy') : '--'}</p>
                </div>
                <div className="hist-mid">
                  <span className={`h-badge ${rec.status === 'present' ? 'b-p' : rec.status === 'absent' ? 'b-a' : 'b-o'}`}>
                    {rec.status?.replace('_', ' ')}
                  </span>
                  {rec.checkIn?.time && <span className="h-time">In: {format(new Date(rec.checkIn.time), 'HH:mm')}</span>}
                </div>
                {rec.checkIn?.location?.latitude && (
                  <div className="h-loc">
                    {rec.checkIn.location.latitude.toFixed(4)}, {rec.checkIn.location.longitude.toFixed(4)}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════
export default function QRAttendance() {
  const role = (localStorage.getItem('userRole') || '').toLowerCase();
  const isHR = role === 'admin' || role === 'hr';
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="w-11 h-11 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg width="22" height="22" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isHR ? 'QR Attendance Panel' : 'Mark My Attendance'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isHR ? 'Generate QR · view daily attendance' : 'Scan HR QR or tap to mark attendance with location check'}
            </p>
          </div>
        </div>
        {isHR ? <HRQRPanel /> : <EmployeeQRPanel />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  CSS
// ═══════════════════════════════════════════════════════
const hrCSS = `
.hr-root { display:flex; flex-direction:column; gap:24px; }
.qr-card { background:white; border-radius:16px; box-shadow:0 1px 3px rgba(15,23,42,.08); padding:24px; border:1px solid #f3f4f6; }
.qr-card-hdr { display:flex; align-items:center; gap:12px; margin-bottom:24px; }
.qr-icon-box { width:40px; height:40px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.qr-card-ttl { font-size:16px; font-weight:700; color:#1e293b; margin:0 0 2px; }
.qr-card-sub { font-size:12px; color:#64748b; margin:0; }
.stop-btn { display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:10px; border:1.5px solid #fca5a5; background:#fff1f2; color:#dc2626; font-size:13px; font-weight:600; cursor:pointer; white-space:nowrap; }
.stop-btn:hover { background:#fee2e2; }
.empty-state { display:flex; flex-direction:column; align-items:center; gap:20px; padding:16px 0; }
.qr-placeholder { width:260px; height:260px; border:2px dashed #e2e8f0; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
.gen-btn { display:flex; align-items:center; gap:8px; padding:10px 20px; border-radius:8px; font-size:14px; font-weight:700; cursor:pointer; border:none; background:#6366f1; color:white; box-shadow:0 1px 3px rgba(15,23,42,.12); transition:all .2s; }
.gen-btn:hover:not(:disabled) { background:#4f46e5; transform:translateY(-1px); box-shadow:0 4px 12px rgba(99,102,241,.28); }
.gen-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
.refresh-btn { background:#6366f1; padding:10px 18px; }
.stop-inline-btn { background:#fff1f2!important; color:#dc2626!important; border:1.5px solid #fca5a5!important; box-shadow:none!important; }
.stop-inline-btn:hover { background:#fee2e2!important; transform:none!important; }
.btn-row { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
.active-state { display:flex; flex-direction:column; align-items:center; gap:18px; }
.ring-wrap { position:relative; width:280px; height:280px; display:flex; align-items:center; justify-content:center; }
.qr-meta { display:flex; align-items:center; gap:14px; }
.qr-timer { font-size:13px; font-weight:700; transition:color .5s; }
.qr-sid { font-size:11px; color:#94a3b8; font-family:monospace; }
.spin { width:13px; height:13px; border:2px solid rgba(255,255,255,.35); border-top-color:white; border-radius:50%; animation:spin .7s linear infinite; display:inline-block; }
@keyframes spin { to { transform:rotate(360deg); } }
/* date panel */
.date-panel { background:white; border-radius:16px; box-shadow:0 1px 3px rgba(15,23,42,.08); padding:24px; border:1px solid #f3f4f6; }
.panel-ttl { display:flex; align-items:center; gap:8px; font-size:15px; font-weight:700; color:#1e293b; margin:0 0 16px; }
.date-item { border-radius:12px; overflow:hidden; border:1px solid #f1f5f9; margin-bottom:8px; }
.date-tog { width:100%; display:flex; align-items:center; gap:8px; padding:13px 16px; background:#f8fafc; border:none; cursor:pointer; font-size:13px; font-weight:500; color:#475569; text-align:left; transition:background .15s; }
.date-tog:hover { background:#f1f5f9; }
.date-tog-on { background:#eff6ff!important; color:#3b82f6; }
.date-lbl { display:flex; align-items:center; gap:8px; flex:1; }
.today-pill { font-size:9px; background:#3b82f6; color:white; border-radius:20px; padding:1px 7px; font-weight:700; }
.date-stats { display:flex; gap:10px; font-size:12px; font-weight:600; }
.sp { color:#059669; } .sa { color:#dc2626; }
.date-detail { padding:14px 16px; background:white; }
.loading-txt { color:#94a3b8; font-size:13px; text-align:center; padding:12px; }
.detail-cols { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
@media(max-width:560px) { .detail-cols { grid-template-columns:1fr; } }
.col-ttl { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; margin:0 0 10px; }
.col-present { color:#059669; } .col-absent { color:#dc2626; }
.dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.dot-present { background:#10b981; } .dot-absent { background:#ef4444; }
.emp-row { display:flex; align-items:center; gap:8px; padding:5px 0; }
.avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:white; flex-shrink:0; }
.avatar-present { background:linear-gradient(135deg,#10b981,#059669); }
.avatar-absent { background:linear-gradient(135deg,#f87171,#dc2626); }
.emp-name { font-size:12px; font-weight:600; color:#1e293b; margin:0; }
.emp-time { font-size:11px; color:#94a3b8; margin:0; }
.no-data { font-size:12px; color:#94a3b8; padding:6px 0; }
`;

const empCSS = `
.emp-root { display:flex; flex-direction:column; gap:20px; position:relative; }
.e-toast { position:fixed; top:20px; right:20px; z-index:9999; padding:13px 18px; border-radius:12px; font-size:13px; font-weight:600; box-shadow:0 8px 30px rgba(0,0,0,.15); animation:sIn .3s ease; max-width:320px; }
.toast-ok { background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; }
.toast-err { background:#fef2f2; color:#991b1b; border:1px solid #fecaca; }
@keyframes sIn { from { transform:translateY(-20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
.status-card { border-radius:20px; padding:24px; display:flex; align-items:center; gap:18px; box-shadow:0 10px 25px -5px rgba(0,0,0,.1); }
.s-present { background:linear-gradient(135deg,#059669,#10b981); }
.s-absent { background:linear-gradient(135deg,#6366f1,#8b5cf6); }
.s-icon { width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,.25); display:flex; align-items:center; justify-content:center; }
.s-label { font-size:10px; color:rgba(255,255,255,.8); text-transform:uppercase; font-weight:700; margin:0; }
.s-value { font-size:24px; font-weight:800; color:white; margin:0; }
.s-time { font-size:11px; color:rgba(255,255,255,.9); margin-top:2px; }
.live-card { background:white; border-radius:16px; box-shadow:0 1px 3px rgba(15,23,42,.08); border:1px solid #f3f4f6; overflow:hidden; }
.live-hdr { display:flex; align-items:center; gap:12px; padding:18px 24px; background:#f8fafc; border-bottom:1px solid #f1f5f9; }
.live-hdr-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; }
.live-ttl { font-size:15px; font-weight:700; color:#1e293b; margin:0; }
.live-sub { font-size:11px; color:#64748b; margin:0; }
.countdown-pill { font-size:11px; font-weight:700; color:#10b981; background:#f0fdf4; padding:4px 12px; border-radius:20px; border:1px solid #bbf7d0; }
.live-body { padding:24px; }
.no-mobile, .no-qr { display:flex; flex-direction:column; align-items:center; text-align:center; gap:12px; padding:20px 0; }
.no-qr-circle { width:72px; height:72px; background:#f1f5f9; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:8px; }
.no-qr-t { font-size:16px; font-weight:700; color:#1e293b; margin:0; }
.no-qr-s { font-size:13px; color:#64748b; max-width:280px; margin:0; line-height:1.5; }
.recheck-btn { margin-top:12px; padding:10px 24px; border-radius:12px; border:1px solid #e2e8f0; background:white; font-size:13px; font-weight:600; color:#475569; cursor:pointer; transition:all .2s; }
.recheck-btn:hover { background:#f8fafc; border-color:#cbd5e1; }
.scan-main { display:flex; flex-direction:column; gap:20px; }
.act-ttl { font-size:18px; font-weight:700; color:#1e293b; margin:0; }
.act-desc { font-size:13px; color:#64748b; line-height:1.6; margin:0; }
.mark-btn { width:100%; padding:12px 16px; border-radius:8px; font-size:15px; font-weight:700; background:#6366f1; color:white; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; box-shadow:0 1px 3px rgba(15,23,42,.12); transition:all .2s; }
.mark-btn:hover:not(:disabled) { background:#4f46e5; }
.mark-btn:active { transform:scale(0.98); opacity:0.9; }
.cam-container { display:flex; flex-direction:column; gap:15px; }
.cam-header { display:flex; align-items:center; justify-content:space-between; }
.scan-msg { font-size:12px; font-weight:600; color:#6366f1; margin:0; }
.cam-cancel { padding:6px 14px; border-radius:8px; border:1px solid #e2e8f0; background:#f8fafc; font-size:12px; font-weight:600; color:#ef4444; cursor:pointer; }
.scan-box { width:100%; aspect-ratio:1/1; max-width:400px; margin:0 auto; border-radius:24px; overflow:hidden; background:black; box-shadow:0 20px 50px rgba(0,0,0,0.2); border:2px solid #f1f5f9; }
.marked-banner { display:flex; align-items:center; gap:10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:16px; padding:16px 20px; font-size:14px; font-weight:600; color:#166534; }
.hist-card { background:white; border-radius:16px; padding:24px; border:1px solid #f3f4f6; box-shadow:0 1px 3px rgba(15,23,42,.08); }
.hist-ttl { font-size:15px; font-weight:700; color:#1e293b; margin:0 0 16px; }
.hist-list { display:flex; flex-direction:column; gap:10px; }
.hist-row { display:flex; align-items:center; gap:12px; padding:14px; border-radius:16px; background:#f8fafc; border:1px solid #f1f5f9; }
.hist-date { min-width:80px; }
.h-day { font-size:10px; text-transform:uppercase; font-weight:700; color:#94a3b8; margin:0; }
.h-full { font-size:13px; font-weight:600; color:#1e293b; margin:0; }
.hist-mid { flex:1; display:flex; align-items:center; gap:8px; }
.h-badge { font-size:10px; font-weight:700; text-transform:uppercase; padding:3px 10px; border-radius:20px; }
.b-p { background:#dcfce7; color:#166534; } .b-a { background:#fee2e2; color:#991b1b; }
.h-time { font-size:12px; color:#64748b; font-weight:500; }
.spin { width:16px; height:16px; border:2.5px solid rgba(255,255,255,.3); border-top-color:white; border-radius:50%; animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
`;

