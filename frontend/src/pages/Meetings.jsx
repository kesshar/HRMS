import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../services/api';

//utilities
/**
 * Compute seconds remaining using backend-supplied jitsiExpiresAt.
 * Falls back to createdAt + jitsiDuration*60 if available.
 */
function computeSecondsLeft(data) {
  if (!data) return 0;
  // Prefer computed expiry from backend (createdAt + duration)
  const expiryRef = data.jitsiExpiresAt || data.expiresAt;
  if (!expiryRef) return 0;
  return Math.max(0, Math.round((new Date(expiryRef) - Date.now()) / 1000));
}
function fmtCountdown(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${String(sec).padStart(2, '0')}s`;
}
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

//duration
const DURATION_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '45 minutes', value: 45 },
  { label: '1 hour',     value: 60 },
  { label: '90 minutes', value: 90 },
  { label: '2 hours',    value: 120 },
];

//admin view
function AdminPanel() {
  const [meeting, setMeeting]       = useState(null);
  const [secs, setSecs]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [ending, setEnding]         = useState(false);
  const [copied, setCopied]         = useState(false);
  const [employees, setEmployees]   = useState([]);

  // Form state
  const [duration, setDuration]               = useState(60);
  const [accessType, setAccessType]           = useState('all');
  const [selectedEmps, setSelectedEmps]       = useState([]);

  const tickRef = useRef(null);
  const pollRef = useRef(null);

  // Fetch employees for multi-select
  useEffect(() => {
    API.get('/employees').then(r => setEmployees(r.data || [])).catch(() => {});
  }, []);

  const startTick = useCallback((initial) => {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => setSecs(c => {
      if (c <= 1) { clearInterval(tickRef.current); return 0; }
      return c - 1;
    }), 1000);
    setSecs(initial);
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const r = await API.get('/meetings/jitsi/active');
      const data = r.data;
      setMeeting(data);
      const rem = computeSecondsLeft(data);
      if (rem <= 0) {
        startTick(0); // Meeting expired, but DON'T hide the panel. Let Admin end it.
      } else {
        startTick(rem);
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setMeeting(null); 
        setSecs(0); 
        clearInterval(tickRef.current);
      }
    }
  }, [startTick]);

  useEffect(() => {
    fetchActive();
    pollRef.current = setInterval(fetchActive, 30000);
    return () => { clearInterval(pollRef.current); clearInterval(tickRef.current); };
  }, [fetchActive]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const r = await API.post('/meetings/jitsi/create', {
        duration,
        accessType,
        selectedEmployees: accessType === 'selected' ? selectedEmps : []
      });
      setMeeting(r.data);
      startTick(computeSecondsLeft(r.data));
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleEnd = async () => {
    if (!confirm('End the meeting for everyone?')) return;
    setEnding(true);
    try {
      await API.post('/meetings/jitsi/end');
      setMeeting(null); setSecs(0); clearInterval(tickRef.current);
    } catch (err) {
      alert('Failed: ' + (err.response?.data?.message || err.message));
    } finally { setEnding(false); }
  };

  const toggleEmp = (id) => setSelectedEmps(prev =>
    prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(meeting.jitsiLink).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const pct = secs > 0 && meeting ? Math.min(100, (secs / (meeting.jitsiDuration * 60)) * 100) : 0;
  const timerCol = secs > 600 ? '#10b981' : secs > 180 ? '#f59e0b' : '#ef4444';

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={S.panelHdr}>
        <div style={{ ...S.iconBadge, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          <CamIcon />
        </div>
        <div>
          <h2 style={S.panelTitle}>Meeting Control Panel</h2>
          <p style={S.panelSub}>Start an instant Jitsi meeting with custom duration and access</p>
        </div>
      </div>

      <div style={S.panelBody}>
        {!meeting ? (
          /* ── Setup form ── */
          <div>
            {/* Duration */}
            <label style={S.label}>
              <span style={S.labelIcon}>⏱</span> Meeting Duration
            </label>
            <div style={S.durationGrid}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDuration(opt.value)}
                  style={{
                    ...S.durationBtn,
                    background: duration === opt.value ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
                    color: duration === opt.value ? 'white' : '#475569',
                    border: duration === opt.value ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                    fontWeight: duration === opt.value ? 700 : 500,
                    boxShadow: duration === opt.value ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Access type */}
            <label style={{ ...S.label, marginTop: 24 }}>
              <span style={S.labelIcon}>👥</span> Meeting Access
            </label>
            <div style={S.accessRow}>
              {[
                { v: 'all',      label: '🌐 All Employees', sub: 'Everyone in your org can join' },
                { v: 'selected', label: '🎯 Selected Only', sub: 'Choose who can join' }
              ].map(opt => (
                <button
                  key={opt.v}
                  onClick={() => setAccessType(opt.v)}
                  style={{
                    ...S.accessBtn,
                    background: accessType === opt.v ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : '#f8fafc',
                    border: accessType === opt.v ? '1.5px solid #8b5cf6' : '1.5px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontWeight: 700, color: accessType === opt.v ? '#6d28d9' : '#1e293b', fontSize: 14 }}>{opt.label}</span>
                  <span style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{opt.sub}</span>
                </button>
              ))}
            </div>

            {/* Employee multi-select */}
            {accessType === 'selected' && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, color: '#475569', margin: 0, fontWeight: 600 }}>
                    Select Employees ({selectedEmps.length} selected)
                  </p>
                  {selectedEmps.length > 0 && (
                    <button onClick={() => setSelectedEmps([])} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Clear all
                    </button>
                  )}
                </div>
                <div style={S.empList}>
                  {employees.map(emp => {
                    const sel = selectedEmps.includes(emp._id);
                    return (
                      <div
                        key={emp._id}
                        onClick={() => toggleEmp(emp._id)}
                        style={{
                          ...S.empRow,
                          background: sel ? 'linear-gradient(135deg,#ede9fe,#f5f3ff)' : '#f8fafc',
                          border: sel ? '1px solid #c4b5fd' : '1px solid #e2e8f0',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ ...S.empAvatar, background: sel ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0' }}>
                          <span style={{ color: sel ? 'white' : '#64748b', fontSize: 13, fontWeight: 700 }}>
                            {emp.name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{emp.name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>{emp.department || emp.email}</p>
                        </div>
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: sel ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'white',
                          border: sel ? 'none' : '1.5px solid #cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {sel && <svg width="11" height="11" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {employees.length === 0 && (
                  <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 16 }}>No employees found</p>
                )}
              </div>
            )}

            {/* Start button */}
            <button
              id="start-meeting-btn"
              onClick={handleStart}
              disabled={loading || (accessType === 'selected' && selectedEmps.length === 0)}
              style={{
                ...S.startBtn,
                marginTop: 28,
                opacity: (accessType === 'selected' && selectedEmps.length === 0) ? 0.5 : 1,
              }}
            >
              {loading
                ? <><span style={S.spinner} /> Generating…</>
                : <><PlayIcon /> Start {DURATION_OPTIONS.find(o => o.value === duration)?.label} Meeting</>
              }
            </button>
            {accessType === 'selected' && selectedEmps.length === 0 && (
              <p style={{ fontSize: 12, color: '#f59e0b', textAlign: 'center', marginTop: 8 }}>
                ⚠ Select at least one employee to enable meeting
              </p>
            )}
          </div>
        ) : (
          /* ── Active meeting ── */
          <div>
            {/* Status + timer */}
            <div style={S.statusRow}>
              <span style={S.liveDot} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>LIVE</span>
              <span style={{ fontSize: 12, color: '#64748b', marginLeft: 6 }}>
                {meeting.jitsiDuration}min session · ends at {fmtTime(meeting.jitsiExpiresAt)}
              </span>
              <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: timerCol }}>
                ⏱ {fmtCountdown(secs)}
              </div>
            </div>
            <div style={S.timerTrack}>
              <div style={{ ...S.timerBar, width: `${pct}%`, background: timerCol }} />
            </div>

            {/* Access badge */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{ ...S.badge, background: meeting.jitsiAccessType === 'all' ? '#ecfdf5' : '#eff6ff', color: meeting.jitsiAccessType === 'all' ? '#059669' : '#3b82f6' }}>
                {meeting.jitsiAccessType === 'all' ? '🌐 All Employees' : `🎯 ${meeting.jitsiSelectedEmployees?.length || 0} Selected`}
              </span>
            </div>

            {/* Link card */}
            <div style={S.linkCard}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b', letterSpacing: '0.05em', marginBottom: 6 }}>MEETING LINK</p>
              <p style={S.linkText}>{meeting.jitsiLink}</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button id="copy-link-btn" onClick={handleCopy} style={{ ...S.actionBtn, background: copied ? '#ecfdf5' : '#f8fafc', color: copied ? '#059669' : '#475569', borderColor: copied ? '#a7f3d0' : '#e2e8f0' }}>
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
                <button id="open-meeting-btn" onClick={() => window.open(meeting.jitsiLink, '_blank')} style={{ ...S.actionBtn, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderColor: 'transparent' }}>
                  🚀 Open Meeting
                </button>
              </div>
            </div>

            {/* Invited employees list */}
            {meeting.jitsiAccessType === 'selected' && meeting.jitsiSelectedEmployees?.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Invited Employees ({meeting.jitsiSelectedEmployees.length})
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {meeting.jitsiSelectedEmployees.map(emp => (
                    <div key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f3ff', borderRadius: 20, padding: '4px 12px', border: '1px solid #ddd6fe' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {emp.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#4c1d95' }}>{emp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* End button – always first, most prominent action */}
            <button id="end-meeting-btn" onClick={handleEnd} disabled={ending} style={{
              ...S.endBtn,
              marginBottom: 16,
              padding: '13px',
              fontSize: 14,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10h6v4H9z" />
              </svg>
              {ending ? 'Ending Meeting…' : '⏹ End Meeting for Everyone'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   EMPLOYEE PANEL
───────────────────────────────────────────────────────── */
function EmployeePanel() {
  const [meeting, setMeeting]       = useState(null);
  const [notInvited, setNotInvited] = useState(false);
  const [secs, setSecs]             = useState(0);
  const tickRef = useRef(null);
  const pollRef = useRef(null);

  const fetchActive = useCallback(async () => {
    try {
      const r = await API.get('/meetings/jitsi/active');
      const data = r.data;
      const rem = computeSecondsLeft(data);
      if (rem <= 0) {
        // Expired — don't show meeting
        setMeeting(null); setNotInvited(false); setSecs(0);
        clearInterval(tickRef.current);
        return;
      }
      setMeeting(data);
      setNotInvited(false);
      setSecs(rem);
      clearInterval(tickRef.current);
      tickRef.current = setInterval(() => setSecs(c => {
        if (c <= 1) { clearInterval(tickRef.current); return 0; }
        return c - 1;
      }), 1000);
    } catch (err) {
      const code = err.response?.data?.code;
      const status = err.response?.status;
      
      if (code === 'NOT_INVITED') {
        setNotInvited(true);
        setMeeting(null);
        setSecs(0);
        clearInterval(tickRef.current);
      } else if (status === 404) {
        setMeeting(null);
        setNotInvited(false);
        setSecs(0);
        clearInterval(tickRef.current);
      }
    }
  }, []);

  useEffect(() => {
    fetchActive();
    pollRef.current = setInterval(fetchActive, 15000);
    return () => { clearInterval(pollRef.current); clearInterval(tickRef.current); };
  }, [fetchActive]);

  const timerCol = secs > 600 ? '#10b981' : secs > 180 ? '#f59e0b' : '#ef4444';

  return (
    <div style={S.panel}>
      <div style={S.panelHdr}>
        <div style={{ ...S.iconBadge, background: meeting ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#94a3b8,#64748b)' }}>
          <CamIcon />
        </div>
        <div>
          <h2 style={S.panelTitle}>Join Today's Meeting</h2>
          <p style={S.panelSub}>
            {meeting ? 'A meeting is live — click to join' : 'No ongoing meeting right now'}
          </p>
        </div>
        {meeting && <div style={S.livePill}><span style={S.liveDot} />LIVE</div>}
      </div>

      <div style={S.panelBody}>
        {meeting ? (
          /* ── Active & invited ── */
          <div style={{ textAlign: 'center' }}>
            <div style={S.pulseWrap}>
              <div style={S.pulseRing1} />
              <div style={S.pulseRing2} />
              <div style={S.pulseCore}><CamIcon size={28} /></div>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '22px 0 6px' }}>Meeting is Live!</h3>
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px' }}>Your team is waiting for you</p>
            <p style={{ fontSize: 13, color: timerCol, fontWeight: 700, margin: '0 0 8px' }}>
              ⏱ {fmtCountdown(secs)} remaining
            </p>
            {meeting.jitsiDuration && (
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 24px' }}>
                {meeting.jitsiAccessType === 'all' ? '🌐 Open to all employees' : '🎯 You are invited'}
              </p>
            )}
            <button id="join-meeting-btn" onClick={() => window.open(meeting.jitsiLink, '_blank', 'noopener')} style={S.joinBtn}>
              <PlayIcon /> Join Meeting Now
            </button>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>Opens Jitsi Meet in a new tab</p>
          </div>
        ) : (
          /* ── No meeting / not invited — show same empty state ── */
          <div style={S.waitState}>
            <div style={S.waitDots}>
              {[0, 0.2, 0.4].map((d, i) => <div key={i} style={{ ...S.dot, animationDelay: `${d}s` }} />)}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '20px 0 8px' }}>No Ongoing Meeting</h3>
            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
              There is no active meeting for you right now.<br />Page auto-refreshes every 15 seconds.
            </p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes bounce-dot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} }
      `}</style>
    </div>
  );
}

//svg icons
function CamIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="white" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 10l4.553-2.069A1 1 0 0121 8.88v6.24a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

//style
const S = {
  panel: { background: 'white', borderRadius: 24, boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #f1f5f9', overflow: 'hidden', maxWidth: 660, margin: '0 auto' },
  panelHdr: { padding: '22px 28px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg,#f8fafc,#eff6ff)', display: 'flex', alignItems: 'center', gap: 16 },
  panelTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 },
  panelSub: { fontSize: 13, color: '#64748b', margin: '2px 0 0' },
  iconBadge: { width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  panelBody: { padding: 28 },
  label: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' },
  labelIcon: { fontSize: 16 },
  durationGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  durationBtn: { padding: '10px 8px', borderRadius: 10, cursor: 'pointer', fontSize: 13, transition: 'all 0.18s' },
  accessRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  accessBtn: { display: 'flex', flexDirection: 'column', padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s' },
  empList: { maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, padding: '2px 0' },
  empRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, transition: 'all 0.15s', userSelect: 'none' },
  empAvatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  startBtn: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', transition: 'transform 0.15s' },
  spinner: { width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin .7s linear infinite', display: 'inline-block' },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  liveDot: { width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,.25)', animation: 'pulse-ring 1.5s ease-out infinite', display: 'inline-block' },
  livePill: { marginLeft: 'auto', background: '#ecfdf5', borderRadius: 999, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#059669' },
  timerTrack: { height: 6, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden', marginBottom: 16 },
  timerBar: { height: '100%', borderRadius: 999, transition: 'width 1s linear, background 1s' },
  badge: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 999 },
  linkCard: { background: '#f8fafc', borderRadius: 14, border: '1px solid #e2e8f0', padding: 18, marginBottom: 16 },
  linkText: { fontSize: 13, fontWeight: 600, color: '#6366f1', wordBreak: 'break-all', margin: 0, lineHeight: 1.6 },
  actionBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: '1px solid', cursor: 'pointer', transition: 'all 0.18s' },
  endBtn: { width: '100%', padding: '11px', borderRadius: 11, fontSize: 13, fontWeight: 600, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' },
  pulseWrap: { position: 'relative', width: 96, height: 96, margin: '0 auto' },
  pulseRing1: { position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(16,185,129,.15)', animation: 'pulse-ring 2s ease-out infinite' },
  pulseRing2: { position: 'absolute', inset: 10, borderRadius: '50%', background: 'rgba(16,185,129,.2)', animation: 'pulse-ring 2s ease-out infinite .5s' },
  pulseCore: { position: 'absolute', inset: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  joinBtn: { display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 42px', borderRadius: 14, fontSize: 16, fontWeight: 800, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', boxShadow: '0 10px 28px rgba(16,185,129,.45)', transition: 'transform 0.15s' },
  waitState: { textAlign: 'center', padding: '12px 0' },
  waitDots: { display: 'flex', gap: 10, justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', animation: 'bounce-dot 1.4s ease-in-out infinite' },
};

//main function
export default function Meetings() {
  const role = (localStorage.getItem('userRole') || '').toLowerCase();
  const isAdmin = role === 'admin';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#eff6ff 50%,#faf5ff 100%)', padding: '40px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Page header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e293b', margin: '0 0 6px' }}>
            {isAdmin ? '📡 Meeting Control' : '🎥 Video Meeting'}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            {isAdmin ? 'Set duration + audience, then start your Jitsi meeting instantly' : 'Join your team\'s secure video meeting with one click'}
          </p>
        </div>

        {isAdmin ? <AdminPanel /> : <EmployeePanel />}

        {/* Info strip */}
        <div style={{ marginTop: 20, background: 'rgba(99,102,241,.06)', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(99,102,241,.12)' }}>
          <span style={{ fontSize: 16 }}>ℹ️</span>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>
            Powered by <strong style={{ color: '#6366f1' }}>Jitsi Meet</strong> — free, open-source, no account needed.
            Meeting expires automatically after the selected duration.
          </p>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.8);opacity:0} }
        @keyframes bounce-dot { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-10px)} }
        #start-meeting-btn:hover { transform: translateY(-2px); }
        #join-meeting-btn:hover  { transform: translateY(-2px); }
        #end-meeting-btn:hover   { background: #fee2e2 !important; }
      `}</style>
    </div>
  );
}
