import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, subDays } from 'date-fns';
import API from '../services/api';

const ACTION_WINDOW_SECONDS = 60;

const getIsAdmin = () => {
  const role = (localStorage.getItem('userRole') || '').toUpperCase();
  return role === 'ADMIN' || role === 'HR';
};

const recentDates = Array.from({ length: 7 }, (_, index) =>
  format(subDays(new Date(), index), 'yyyy-MM-dd')
);

const statusLabel = (status) => (status || 'not marked').replace(/_/g, ' ');

const getTimerTone = (seconds) => {
  if (seconds > 30) return 'good';
  if (seconds > 10) return 'warn';
  return 'danger';
};

const EMPTY_TIMER = {
  status: 'not_started',
  hasStartedToday: false,
  remainingSeconds: 0,
  durationSeconds: ACTION_WINDOW_SECONDS,
  serverNow: null,
  startedAt: null,
  expiresAt: null
};

const getRemainingFromTimer = (timer, serverOffsetRef) => {
  if (!timer?.expiresAt || timer.status !== 'running') return 0;

  const serverNow = Date.now() - serverOffsetRef.current;
  return Math.max(0, Math.ceil((new Date(timer.expiresAt).getTime() - serverNow) / 1000));
};

const useAttendanceTimer = () => {
  const [timer, setTimer] = useState(EMPTY_TIMER);
  const [timerLoading, setTimerLoading] = useState(true);
  const [timerError, setTimerError] = useState('');
  const serverOffsetRef = useRef(0);

  const applyTimer = useCallback((data) => {
    if (data?.serverNow) {
      serverOffsetRef.current = Date.now() - new Date(data.serverNow).getTime();
    }

    const nextTimer = { ...EMPTY_TIMER, ...data };
    const remainingSeconds = getRemainingFromTimer(nextTimer, serverOffsetRef);
    setTimer({
      ...nextTimer,
      status: nextTimer.status === 'running' && remainingSeconds <= 0 ? 'expired' : nextTimer.status,
      remainingSeconds
    });
  }, []);

  const fetchTimer = useCallback(async () => {
    try {
      setTimerLoading(true);
      setTimerError('');
      const response = await API.get('/attendance/timer/status');
      applyTimer(response.data);
      return response.data;
    } catch (err) {
      setTimerError(err.response?.data?.message || 'Unable to load attendance timer.');
      return null;
    } finally {
      setTimerLoading(false);
    }
  }, [applyTimer]);

  const startTimer = useCallback(async () => {
    try {
      setTimerLoading(true);
      setTimerError('');
      const response = await API.post('/attendance/timer/start');
      applyTimer(response.data);
      return { ok: true, data: response.data };
    } catch (err) {
      const existingTimer = err.response?.data?.timer;
      if (existingTimer) applyTimer(existingTimer);
      const message = err.response?.data?.message || 'Unable to start attendance timer.';
      setTimerError(message);
      return { ok: false, message };
    } finally {
      setTimerLoading(false);
    }
  }, [applyTimer]);

  useEffect(() => {
    fetchTimer();
  }, [fetchTimer]);

  useEffect(() => {
    if (timer.status !== 'running') return undefined;

    const intervalId = window.setInterval(() => {
      setTimer((current) => {
        const remainingSeconds = getRemainingFromTimer(current, serverOffsetRef);
        if (remainingSeconds <= 0) {
          return { ...current, status: 'expired', remainingSeconds: 0 };
        }
        return { ...current, remainingSeconds };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timer.status]);

  return { timer, timerLoading, timerError, fetchTimer, startTimer, setTimerError };
};

const Notice = ({ type, message, onClose }) => (
  <div className={`notice notice-${type}`}>
    <span>{message}</span>
    {onClose && (
      <button type="button" className="notice-close" onClick={onClose} aria-label="Dismiss message">
        x
      </button>
    )}
  </div>
);

const AdminDatePanel = () => {
  const [dateRecords, setDateRecords] = useState({});
  const [expandedDate, setExpandedDate] = useState(recentDates[0]);
  const [loadingDate, setLoadingDate] = useState('');
  const [error, setError] = useState('');

  const loadDate = useCallback(async (date) => {
    if (expandedDate === date && dateRecords[date]) {
      setExpandedDate('');
      return;
    }

    setExpandedDate(date);
    if (dateRecords[date]) return;

    try {
      setLoadingDate(date);
      setError('');
      const response = await API.get(`/attendance/date/${date}`);
      setDateRecords((prev) => ({ ...prev, [date]: response.data }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load attendance for this date.');
    } finally {
      setLoadingDate('');
    }
  }, [dateRecords, expandedDate]);

  useEffect(() => {
    loadDate(recentDates[0]);
  }, []);

  return (
    <>
    <TimerStatusPanel isAdmin />
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Daily register</p>
          <h2>Attendance by date</h2>
        </div>
        <span className="soft-pill">Last 7 days</span>
      </div>

      {error && <Notice type="error" message={error} onClose={() => setError('')} />}

      <div className="date-list">
        {recentDates.map((date) => {
          const record = dateRecords[date];
          const open = expandedDate === date;
          const isToday = date === format(new Date(), 'yyyy-MM-dd');

          return (
            <div className="date-card" key={date}>
              <button type="button" className={`date-toggle ${open ? 'active' : ''}`} onClick={() => loadDate(date)}>
                <span>
                  <strong>{format(new Date(`${date}T00:00:00`), 'EEEE, MMM d')}</strong>
                  {isToday && <small>Today</small>}
                </span>
                {record && (
                  <span className="date-counts">
                    <b className="present-count">{record.present?.length || 0} present</b>
                    <b className="absent-count">{record.absent?.length || 0} absent</b>
                  </span>
                )}
              </button>

              {open && (
                <div className="date-detail">
                  {loadingDate === date && !record ? (
                    <p className="muted center">Loading records...</p>
                  ) : record ? (
                    <div className="detail-grid">
                      <EmployeeList title="Present" tone="present" employees={record.present || []} />
                      <EmployeeList title="Absent" tone="absent" employees={record.absent || []} />
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
    </>
  );
};

const EmployeeList = ({ title, tone, employees }) => (
  <div className="employee-list">
    <h3 className={tone}>{title} ({employees.length})</h3>
    {employees.length === 0 ? (
      <p className="muted">No employees in this group.</p>
    ) : (
      employees.map((entry, index) => (
        <div className="employee-row" key={entry.employee?._id || index}>
          <span className={`avatar ${tone}`}>{entry.employee?.name?.[0]?.toUpperCase() || '?'}</span>
          <span>
            <strong>{entry.employee?.name || 'Unknown'}</strong>
            <small>
              {entry.checkInTime ? `In ${format(new Date(entry.checkInTime), 'HH:mm')}` : 'Not marked'}
            </small>
          </span>
        </div>
      ))
    )}
  </div>
);

const TimerStatusPanel = ({ isAdmin = false }) => {
  const { timer, timerLoading, timerError, startTimer, setTimerError } = useAttendanceTimer();
  const [notice, setNotice] = useState('');
  const timerTone = getTimerTone(timer.remainingSeconds);
  const timerProgress = ((timer.remainingSeconds || 0) / (timer.durationSeconds || ACTION_WINDOW_SECONDS)) * 100;
  const canStart = isAdmin && !timer.hasStartedToday && !timerLoading;

  const statusText = {
    not_started: 'Not started',
    running: 'Running',
    expired: 'Expired'
  }[timer.status] || 'Unavailable';

  const helperText = {
    not_started: isAdmin
      ? 'Start today\'s attendance timer when the team is ready.'
      : 'HR has not started today\'s attendance timer yet.',
    running: 'The attendance window is open now.',
    expired: 'Today\'s attendance timer has already been used.'
  }[timer.status] || 'Unable to read the current timer state.';

  const handleStart = async () => {
    const result = await startTimer();
    setNotice(result.ok ? 'Attendance timer started for today.' : result.message);
  };

  return (
    <section className="panel action-panel">
      <div className="timer-card">
        <div className="timer-ring" style={{ '--progress': `${timerProgress}%` }}>
          <span className={timerTone}>{timer.status === 'running' ? timer.remainingSeconds : 0}</span>
        </div>
        <div>
          <p className="eyebrow">Attendance timer</p>
          <h2>{timer.status === 'running' ? `${timer.remainingSeconds}s remaining` : statusText}</h2>
          <p className="muted">{helperText}</p>
          {timer.startedAt && (
            <p className="timer-meta">
              Started {format(new Date(timer.startedAt), 'hh:mm a')} · Expires {format(new Date(timer.expiresAt), 'hh:mm a')}
            </p>
          )}
        </div>
      </div>

      {timerError && <Notice type="error" message={timerError} onClose={() => setTimerError('')} />}
      {notice && <Notice type={timer.status === 'running' ? 'success' : 'info'} message={notice} onClose={() => setNotice('')} />}

      {isAdmin && (
        <div className="action-row">
          <button type="button" className="primary-action" onClick={handleStart} disabled={!canStart}>
            {timerLoading ? 'Checking timer...'
              : timer.hasStartedToday ? 'Timer already started today'
                : 'Start attendance timer'}
          </button>
        </div>
      )}
    </section>
  );
};

const EmployeeAttendancePanel = () => {
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [marking, setMarking] = useState(false);
  const [message, setMessage] = useState(null);
  const { timer, timerLoading, timerError, fetchTimer, setTimerError } = useAttendanceTimer();

  const isPresent = Boolean(todayStatus?.checkIn);
  const timerTone = getTimerTone(timer.remainingSeconds);
  const timerProgress = ((timer.remainingSeconds || 0) / (timer.durationSeconds || ACTION_WINDOW_SECONDS)) * 100;
  const timerMessage = {
    not_started: 'Waiting for HR to start today\'s attendance timer.',
    running: 'Submit attendance before the timer reaches zero.',
    expired: 'Today\'s attendance timer has expired.'
  }[timer.status] || 'Checking timer status.';

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      const [todayResponse, historyResponse] = await Promise.all([
        API.get('/attendance/today'),
        API.get('/attendance/my-attendance?limit=20')
      ]);

      setTodayStatus(todayResponse.data);
      setHistory(historyResponse.data.attendance || []);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to load attendance.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markPresent = async () => {
    if (timer.status !== 'running' || isPresent) return;

    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Location services are not available on this device.' });
      return;
    }

    setLocating(true);
    setMessage({ type: 'info', text: 'Getting your current coordinates...' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocating(false);
        setMarking(true);

        try {
          await API.post('/attendance/check-in', { latitude, longitude });
          setMessage({ type: 'success', text: 'Attendance marked successfully.' });
          await Promise.all([fetchAttendance(), fetchTimer()]);
        } catch (err) {
          setMessage({ type: 'error', text: err.response?.data?.message || 'Unable to mark attendance.' });
        } finally {
          setMarking(false);
        }
      },
      () => {
        setLocating(false);
        setMessage({ type: 'error', text: 'Location permission is required to mark attendance.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const actionDisabled = loading || timerLoading || locating || marking || isPresent || timer.status !== 'running';

  return (
    <>
      <section className={`status-hero ${isPresent ? 'complete' : ''}`}>
        <div>
          <p className="eyebrow">Today</p>
          <h2>{isPresent ? 'Attendance complete' : 'Ready for location check-in'}</h2>
          <p>
            {isPresent && todayStatus?.checkIn?.time
              ? `Checked in at ${format(new Date(todayStatus.checkIn.time), 'hh:mm a')}`
              : 'Use your current coordinates to mark attendance for today.'}
          </p>
        </div>
        <div className="status-chip">{isPresent ? 'Present' : 'Pending'}</div>
      </section>

      <section className="panel action-panel">
        <div className="timer-card">
          <div className="timer-ring" style={{ '--progress': `${timerProgress}%` }}>
            <span className={timerTone}>{timer.status === 'running' ? timer.remainingSeconds : 0}</span>
          </div>
          <div>
            <p className="eyebrow">Action window</p>
            <h2>{timer.status === 'running' ? `${timer.remainingSeconds}s remaining` : timer.status.replace('_', ' ')}</h2>
            <p className="muted">{timerMessage}</p>
          </div>
        </div>

        {timerError && <Notice type="error" message={timerError} onClose={() => setTimerError('')} />}
        {message && <Notice type={message.type} message={message.text} onClose={() => setMessage(null)} />}

        <div className="action-row">
          <button type="button" className="primary-action" onClick={markPresent} disabled={actionDisabled}>
            {loading ? 'Loading...'
              : timerLoading ? 'Checking timer...'
                : locating ? 'Checking coordinates...'
                  : marking ? 'Recording attendance...'
                    : isPresent ? 'Attendance marked'
                      : timer.status === 'not_started' ? 'Waiting for HR'
                        : timer.status === 'expired' ? 'Timer expired'
                          : 'Mark attendance'}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <p className="eyebrow">History</p>
            <h2>Recent attendance</h2>
          </div>
        </div>

        {loading ? (
          <p className="muted center">Loading attendance...</p>
        ) : history.length === 0 ? (
          <p className="muted center">No attendance records found.</p>
        ) : (
          <div className="history-list">
            {history.map((record) => (
              <div className="history-row" key={record._id}>
                <div>
                  <strong>{record.date ? format(new Date(record.date), 'MMM d, yyyy') : '-'}</strong>
                  <small>{record.checkIn?.time ? `In ${format(new Date(record.checkIn.time), 'HH:mm')}` : 'No check-in'}</small>
                </div>
                <span className={`badge ${record.status || 'empty'}`}>{statusLabel(record.status)}</span>
                {record.checkIn?.location?.latitude && (
                  <small className="coords">
                    {record.checkIn.location.latitude.toFixed(4)}, {record.checkIn.location.longitude.toFixed(4)}
                  </small>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

export default function LocationAttendancePage() {
  const isAdmin = useMemo(getIsAdmin, []);

  return (
    <main className="attendance-page">
      <style>{styles}</style>
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">Coordinate attendance</p>
            <h1>{isAdmin ? 'Attendance overview' : 'Mark attendance'}</h1>
            <p>
              {isAdmin
                ? 'Review daily presence from the team attendance register.'
                : 'Confirm your presence with secure location-based attendance.'}
            </p>
          </div>
          <span className="header-pill">{format(new Date(), 'EEE, MMM d')}</span>
        </header>

        {isAdmin ? <AdminDatePanel /> : <EmployeeAttendancePanel />}
      </div>
    </main>
  );
}

const styles = `
.attendance-page {
  min-height: 100vh;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.22), transparent 34%),
    linear-gradient(135deg, #eef7f6 0%, #f8fbff 44%, #eef2ff 100%);
  color: #102033;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.page-shell { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }
.page-header, .status-hero, .panel {
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.1);
  backdrop-filter: blur(14px);
}
.page-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  border-radius: 8px;
  padding: 28px;
}
.page-header h1, .status-hero h2, .panel h2 { margin: 0; color: #0f172a; letter-spacing: 0; }
.page-header h1 { font-size: clamp(28px, 5vw, 42px); line-height: 1.05; }
.page-header p, .status-hero p, .muted { color: #64748b; line-height: 1.6; margin: 8px 0 0; }
.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
}
.header-pill, .soft-pill, .status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 8px 12px;
  background: #ecfeff;
  color: #155e75;
  border: 1px solid #bae6fd;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}
.status-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 26px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(37, 99, 235, 0.9));
}
.status-hero.complete { background: linear-gradient(135deg, rgba(5, 150, 105, 0.95), rgba(20, 184, 166, 0.9)); }
.status-hero h2, .status-hero p, .status-hero .eyebrow { color: #ffffff; }
.status-hero p { opacity: 0.9; }
.status-chip { background: rgba(255,255,255,0.18); color: #fff; border-color: rgba(255,255,255,0.28); }
.panel { border-radius: 8px; padding: 24px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 18px; }
.action-panel { display: flex; flex-direction: column; gap: 18px; }
.timer-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 20px;
  align-items: center;
}
.timer-ring {
  --progress: 100%;
  width: 116px;
  height: 116px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: conic-gradient(#14b8a6 var(--progress), #e2e8f0 0);
  position: relative;
}
.timer-ring::after {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  background: #fff;
}
.timer-ring span { position: relative; z-index: 1; font-size: 34px; font-weight: 900; color: #0f766e; }
.timer-ring span.warn { color: #b45309; }
.timer-ring span.danger { color: #dc2626; }
.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 650;
}
.notice-success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
.notice-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
.notice-info { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.notice-close { border: 0; background: transparent; color: inherit; cursor: pointer; font-weight: 900; }
.action-row { display: flex; gap: 12px; flex-wrap: wrap; }
.primary-action, .secondary-action {
  border: 0;
  border-radius: 8px;
  padding: 13px 18px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}
.primary-action {
  flex: 1 1 240px;
  color: #fff;
  background: linear-gradient(135deg, #0f766e, #2563eb);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.22);
}
.secondary-action { color: #334155; background: #f8fafc; border: 1px solid #dbe3ef; }
.primary-action:hover:not(:disabled), .secondary-action:hover:not(:disabled) { transform: translateY(-1px); }
.primary-action:disabled, .secondary-action:disabled { opacity: 0.58; cursor: not-allowed; transform: none; box-shadow: none; }
.history-list, .date-list { display: flex; flex-direction: column; gap: 10px; }
.history-row, .date-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}
.history-row {
  display: grid;
  grid-template-columns: minmax(150px, 1fr) auto auto;
  align-items: center;
  gap: 14px;
  padding: 14px;
}
.history-row strong, .employee-row strong { display: block; font-size: 14px; color: #0f172a; }
.history-row small, .employee-row small { display: block; color: #64748b; margin-top: 3px; }
.coords { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
.badge {
  justify-self: start;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: capitalize;
  background: #e0f2fe;
  color: #075985;
}
.badge.present { background: #dcfce7; color: #166534; }
.badge.absent { background: #fee2e2; color: #991b1b; }
.badge.late { background: #fef3c7; color: #92400e; }
.date-toggle {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  text-align: left;
  cursor: pointer;
}
.date-toggle.active { background: #ecfeff; }
.date-toggle strong { color: #0f172a; }
.date-toggle small {
  margin-left: 8px;
  color: #0f766e;
  font-weight: 800;
}
.date-counts { display: inline-flex; gap: 10px; flex-wrap: wrap; font-size: 12px; }
.present-count { color: #047857; }
.absent-count { color: #b91c1c; }
.date-detail { padding: 0 15px 15px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.employee-list {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
}
.employee-list h3 { margin: 0 0 12px; font-size: 14px; }
.employee-list h3.present { color: #047857; }
.employee-list h3.absent { color: #b91c1c; }
.employee-row { display: flex; gap: 10px; align-items: center; padding: 8px 0; }
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 900;
  font-size: 12px;
  flex: 0 0 auto;
}
.avatar.present { background: linear-gradient(135deg, #10b981, #047857); }
.avatar.absent { background: linear-gradient(135deg, #f97316, #dc2626); }
.center { text-align: center; padding: 18px; }
@media (max-width: 720px) {
  .attendance-page { padding: 20px 12px; }
  .page-header, .status-hero, .panel-head, .timer-card { grid-template-columns: 1fr; flex-direction: column; align-items: flex-start; }
  .timer-card { display: flex; }
  .history-row { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
}
`;
