import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { format } from 'date-fns';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getUserIdFromStorage = () => {
  const stored = localStorage.getItem('userId');
  if (stored) return stored;
  const token = localStorage.getItem('token') || localStorage.getItem('employeeToken');
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.id || payload.userId || '';
  } catch {
    return '';
  }
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#b45309', bg: '#fef3c7', dot: '#d97706' },
  under_review: { label: 'Under Review', color: '#1d4ed8', bg: '#dbeafe', dot: '#3b82f6' },
  resolved: { label: 'Resolved', color: '#15803d', bg: '#dcfce7', dot: '#22c55e' },
  dismissed: { label: 'Dismissed', color: '#b91c1c', bg: '#fee2e2', dot: '#ef4444' },
};

const SEVERITY_CONFIG = {
  low: { label: 'Low', color: '#15803d', bg: '#dcfce7' },
  medium: { label: 'Medium', color: '#92400e', bg: '#fef3c7' },
  high: { label: 'High', color: '#c2410c', bg: '#ffedd5' },
  critical: { label: 'Critical', color: '#991b1b', bg: '#fee2e2' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
      color: cfg.color, backgroundColor: cfg.bg,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const SeverityBadge = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity] || { label: severity, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 500,
      color: cfg.color, backgroundColor: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
};

const EMPTY_FORM = {
  reportedUserId: '', reason: '', description: '',
  severity: 'medium', anonymous: false, evidence: [],
};

const EMPTY_UPDATE = { status: '', reviewNotes: '', resolution: '' };

// ─── Stat Card ──────────────────────────────────────────────────────────────

const StatCard = ({ label, value, accent }) => (
  <div style={{
    background: '#fff', borderRadius: 12, padding: '20px 24px',
    border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 4,
  }}>
    <span style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
    <span style={{ fontSize: 28, fontWeight: 700, color: accent || '#111827', lineHeight: 1.2 }}>
      {value}
    </span>
  </div>
);

// ─── Modal Shell ─────────────────────────────────────────────────────────────

const Modal = ({ onClose, title, width = 480, children }) => (
  <div
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16,
    }}
  >
    <div style={{
      background: '#fff', borderRadius: 16, width: '100%', maxWidth: width,
      maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 24px', borderBottom: '1px solid #f3f4f6',
      }}>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: '#111827' }}>{title}</h2>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4, fontSize: 20, lineHeight: 1 }}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  </div>
);

// ─── Field ───────────────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1px solid #d1d5db', fontSize: 14, color: '#111827',
  boxSizing: 'border-box', outline: 'none', background: '#fff',
};

const selectStyle = { ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 };

// ─── Main Component ──────────────────────────────────────────────────────────

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [reportsAgainstMe, setReportsAgainstMe] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState('my-reports');
  const [stats, setStats] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId] = useState(getUserIdFromStorage);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [updateData, setUpdateData] = useState(EMPTY_UPDATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const role = localStorage.getItem('userRole')?.toUpperCase();
    const admin = role === 'ADMIN' || role === 'HR';
    setIsAdmin(admin);
    if (admin) setActiveTab('all');
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchMyReports();
    fetchReportsAgainstMe();
    if (isAdmin) {
      fetchAllReports();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchEmployees = async () => { try { const r = await API.get('/employees'); setEmployees(r.data); } catch (e) { console.error(e); } };
  const fetchAllReports = async () => { try { const r = await API.get('/reports/all'); setReports(r.data.reports || []); } catch (e) { console.error(e); } };
  const fetchMyReports = async () => { try { const r = await API.get('/reports/my-reports'); setMyReports(r.data.reports || []); } catch (e) { console.error(e); } };
  const fetchReportsAgainstMe = async () => { try { const r = await API.get('/reports/against-me'); setReportsAgainstMe(r.data.reports || []); } catch (e) { console.error(e); } };
  const fetchStats = async () => { try { const r = await API.get('/reports/stats'); setStats(r.data); } catch (e) { console.error(e); } };

  const createReport = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await API.post('/reports', formData);
      setShowCreateModal(false);
      setFormData(EMPTY_FORM);
      fetchMyReports();
    } catch (e) {
      setError('Failed to submit report. Please try again.');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateReportStatus = async (reportId) => {
    setIsSubmitting(true);
    try {
      await API.patch(`/reports/${reportId}/status`, updateData);
      setShowViewModal(false);
      setUpdateData(EMPTY_UPDATE);
      fetchMyReports();
      if (isAdmin) { fetchAllReports(); fetchStats(); }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayReports =
    activeTab === 'all' ? reports :
      activeTab === 'my-reports' ? myReports :
        reportsAgainstMe;

  const totalReports = stats?.statusStats?.reduce((a, s) => a + s.count, 0) ?? 0;

  const tabs = [
    ...(isAdmin ? [{ id: 'all', label: 'All Reports', count: reports.length }] : []),
    { id: 'my-reports', label: 'Filed by Me', count: myReports.length },
    ...(isAdmin ? [{ id: 'against-me', label: 'Against Me', count: reportsAgainstMe.length }] : []),
  ];

  const reporterLabel = (report) => {
    const rid = (report.reportedBy?._id || report.reportedBy)?.toString();
    if (rid === currentUserId?.toString()) return 'You';
    if (report.anonymous && !isAdmin) return 'Anonymous';
    return report.reportedBy?.name || 'N/A';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '32px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>Reports</h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6b7280' }}>
              {isAdmin ? 'Manage and review all employee reports' : 'Track and manage your submitted reports'}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', background: '#2563eb', color: '#fff',
                border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 500,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Report
            </button>
          )}
        </div>

        {/* Stats */}
        {isAdmin && stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Total" value={totalReports} accent="#111827" />
            <StatCard label="Pending" value={stats.statusStats.find(s => s._id === 'pending')?.count || 0} accent="#d97706" />
            <StatCard label="Under Review" value={stats.statusStats.find(s => s._id === 'under_review')?.count || 0} accent="#2563eb" />
            <StatCard label="Resolved" value={stats.statusStats.find(s => s._id === 'resolved')?.count || 0} accent="#16a34a" />
          </div>
        )}

        {/* Tabs + Table Card */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

          {/* Tab bar */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', padding: '0 20px', gap: 4 }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '14px 16px', fontSize: 14, fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: activeTab === t.id ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeTab === t.id ? '#2563eb' : '#6b7280',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  marginBottom: -1,
                }}
              >
                {t.label}
                <span style={{
                  padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: activeTab === t.id ? '#dbeafe' : '#f3f4f6',
                  color: activeTab === t.id ? '#1d4ed8' : '#6b7280',
                }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            {displayReports.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: '#374151' }}>No reports found</p>
                <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                  {activeTab === 'my-reports' ? 'You haven\'t filed any reports yet.' : 'Nothing to show here.'}
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Date', 'Reported Person', 'Reason', 'Severity', 'Status', 'Reporter', ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600, color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayReports.map((report, idx) => (
                    <tr
                      key={report._id}
                      style={{
                        borderBottom: idx < displayReports.length - 1 ? '1px solid #f3f4f6' : 'none',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {report.createdAt && !isNaN(new Date(report.createdAt))
                          ? format(new Date(report.createdAt), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>
                        {report.reportedUser?.name || 'Unknown'}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#374151', textTransform: 'capitalize' }}>
                        {report.reason?.replace(/_/g, ' ')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <SeverityBadge severity={report.severity} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <StatusBadge status={report.status} />
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {reporterLabel(report)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => { setSelectedReport(report); setUpdateData(EMPTY_UPDATE); setShowViewModal(true); }}
                          style={{
                            padding: '6px 14px', border: '1px solid #d1d5db', borderRadius: 7,
                            background: '#fff', fontSize: 13, color: '#374151',
                            cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap',
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Create Report Modal ── */}
        {showCreateModal && (
          <Modal title="File a New Report" onClose={() => { setShowCreateModal(false); setError(''); }} width={520}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              <Field label="Report Against *">
                <select value={formData.reportedUserId} onChange={e => setFormData(p => ({ ...p, reportedUserId: e.target.value }))} style={selectStyle}>
                  <option value="">Select employee…</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </Field>

              <Field label="Reason *">
                <select value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} style={selectStyle}>
                  <option value="">Select a reason…</option>
                  <option value="misconduct">Misconduct</option>
                  <option value="harassment">Harassment</option>
                  <option value="performance">Performance Issues</option>
                  <option value="attendance">Attendance Issues</option>
                  <option value="policy_violation">Policy Violation</option>
                  <option value="other">Other</option>
                </select>
              </Field>

              <Field label="Severity">
                <select value={formData.severity} onChange={e => setFormData(p => ({ ...p, severity: e.target.value }))} style={selectStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>

              <Field label="Description *">
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="Provide a detailed description of the incident…"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                />
              </Field>

              <Field label="Supporting Evidence (optional)">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const type = file.type.startsWith('image/') ? 'image' : 'pdf';
                      setFormData(p => ({ ...p, evidence: [{ type, url: reader.result, name: file.name }] }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  style={{ fontSize: 13, color: '#374151' }}
                />
                {formData.evidence.length > 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Attached: {formData.evidence[0].name}
                  </p>
                )}
              </Field>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#374151', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.anonymous}
                  onChange={e => setFormData(p => ({ ...p, anonymous: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer' }}
                />
                Submit anonymously
              </label>

              {error && (
                <p style={{ margin: 0, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button
                  onClick={createReport}
                  disabled={!formData.reportedUserId || !formData.reason || !formData.description || isSubmitting}
                  style={{
                    flex: 1, padding: '10px 0', background: '#2563eb', color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    opacity: (!formData.reportedUserId || !formData.reason || !formData.description || isSubmitting) ? 0.5 : 1,
                  }}
                >
                  {isSubmitting ? 'Submitting…' : 'Submit Report'}
                </button>
                <button
                  onClick={() => { setShowCreateModal(false); setError(''); }}
                  style={{
                    flex: 1, padding: '10px 0', background: '#f3f4f6', color: '#374151',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* ── View Report Modal ── */}
        {showViewModal && selectedReport && (() => {
          const reporterId = (selectedReport.reportedBy?._id || selectedReport.reportedBy)?.toString();
          const isOwner = reporterId === currentUserId?.toString();

          return (
            <Modal title="Report Details" onClose={() => setShowViewModal(false)} width={620}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Top row: date + status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DetailItem label="Date Filed">
                    {selectedReport.createdAt && !isNaN(new Date(selectedReport.createdAt))
                      ? format(new Date(selectedReport.createdAt), 'MMM d, yyyy · HH:mm')
                      : '—'}
                  </DetailItem>
                  <DetailItem label="Status">
                    <StatusBadge status={selectedReport.status} />
                  </DetailItem>
                </div>

                <Divider />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DetailItem label="Filed By">
                    {selectedReport.anonymous ? (
                      <span style={{ fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>Anonymous</span>
                    ) : selectedReport.reportedBy?.name}
                  </DetailItem>
                  <DetailItem label="Reported Person">
                    {selectedReport.reportedUser?.name}
                  </DetailItem>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <DetailItem label="Reason">
                    <span style={{ textTransform: 'capitalize' }}>{selectedReport.reason?.replace(/_/g, ' ')}</span>
                  </DetailItem>
                  <DetailItem label="Severity">
                    <SeverityBadge severity={selectedReport.severity} />
                  </DetailItem>
                </div>

                <DetailItem label="Description">
                  <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.65 }}>
                    {selectedReport.description}
                  </p>
                </DetailItem>

                {/* Evidence */}
                {selectedReport.evidence?.length > 0 && (
                  <>
                    <Divider />
                    <DetailItem label="Evidence">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {selectedReport.evidence.map((item, idx) => (
                          item.url?.startsWith('data:image') || item.type === 'image' ? (
                            <img
                              key={idx}
                              src={item.url}
                              alt="Evidence"
                              onClick={() => { const w = window.open(); w.document.write(`<img src="${item.url}" style="max-width:100%;height:auto;">`); }}
                              style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'zoom-in' }}
                            />
                          ) : (
                            <div key={idx} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '12px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ fontSize: 22 }}>📄</span>
                                <div>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#111827' }}>{item.name || 'Document'}</p>
                                  <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>PDF file</p>
                                </div>
                              </div>
                              <button
                                onClick={() => { const w = window.open(); w.document.write(`<iframe src="${item.url}" style="width:100%;height:100vh;border:none;"></iframe>`); }}
                                style={{
                                  padding: '6px 14px', background: '#fff', border: '1px solid #d1d5db',
                                  borderRadius: 7, fontSize: 13, color: '#374151', cursor: 'pointer', fontWeight: 500,
                                }}
                              >
                                View PDF
                              </button>
                            </div>
                          )
                        ))}
                      </div>
                    </DetailItem>
                  </>
                )}

                {/* Review info */}
                {selectedReport.reviewedBy && (
                  <>
                    <Divider />
                    <DetailItem label="Reviewed By">{selectedReport.reviewedBy?.name}</DetailItem>
                    {selectedReport.reviewNotes && (
                      <DetailItem label="Review Notes">
                        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{selectedReport.reviewNotes}</p>
                      </DetailItem>
                    )}
                    {selectedReport.resolution && (
                      <DetailItem label="Resolution">
                        <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{selectedReport.resolution}</p>
                      </DetailItem>
                    )}
                  </>
                )}

                {/* Owner update section */}
                {!isAdmin && isOwner && (
                  <>
                    <Divider />
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>Update Report</h3>
                        {selectedReport.status !== 'resolved' && (
                          <button
                            onClick={() => {
                              setUpdateData({ status: 'resolved', reviewNotes: 'Resolved by reporter', resolution: 'Settled' });
                              updateReportStatus(selectedReport._id);
                            }}
                            style={{
                              padding: '5px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                              borderRadius: 20, fontSize: 12, fontWeight: 500, color: '#15803d', cursor: 'pointer',
                            }}
                          >
                            ✓ Mark as Resolved
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Field label="Status">
                          <select value={updateData.status} onChange={e => setUpdateData(p => ({ ...p, status: e.target.value }))} style={selectStyle}>
                            <option value="">Select new status…</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </Field>
                        <Field label="Notes">
                          <textarea
                            value={updateData.reviewNotes}
                            onChange={e => setUpdateData(p => ({ ...p, reviewNotes: e.target.value }))}
                            rows={3}
                            placeholder="Add any notes…"
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                          />
                        </Field>
                        <Field label="Resolution">
                          <textarea
                            value={updateData.resolution}
                            onChange={e => setUpdateData(p => ({ ...p, resolution: e.target.value }))}
                            rows={3}
                            placeholder="Describe the resolution…"
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                          />
                        </Field>
                        <button
                          onClick={() => updateReportStatus(selectedReport._id)}
                          disabled={!updateData.status || isSubmitting}
                          style={{
                            padding: '10px 0', background: '#2563eb', color: '#fff',
                            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', opacity: (!updateData.status || isSubmitting) ? 0.5 : 1,
                          }}
                        >
                          {isSubmitting ? 'Updating…' : 'Update Report'}
                        </button>
                        <button
                          onClick={() => window.location.href = '/chat'}
                          style={{
                            padding: '10px 0', background: '#eff6ff', color: '#1d4ed8',
                            border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 14,
                            fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          Open Chat to Discuss
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Admin update section */}
                {isAdmin && (
                  <>
                    <Divider />
                    <div>
                      <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600, color: '#111827' }}>Admin Actions</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <Field label="Update Status">
                          <select value={updateData.status} onChange={e => setUpdateData(p => ({ ...p, status: e.target.value }))} style={selectStyle}>
                            <option value="">Select status…</option>
                            <option value="under_review">Under Review</option>
                            <option value="resolved">Resolved</option>
                            <option value="dismissed">Dismissed</option>
                          </select>
                        </Field>
                        <Field label="Review Notes">
                          <textarea
                            value={updateData.reviewNotes}
                            onChange={e => setUpdateData(p => ({ ...p, reviewNotes: e.target.value }))}
                            rows={3}
                            placeholder="Internal notes…"
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                          />
                        </Field>
                        <Field label="Resolution">
                          <textarea
                            value={updateData.resolution}
                            onChange={e => setUpdateData(p => ({ ...p, resolution: e.target.value }))}
                            rows={3}
                            placeholder="Outcome / resolution details…"
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                          />
                        </Field>
                        <button
                          onClick={() => updateReportStatus(selectedReport._id)}
                          disabled={!updateData.status || isSubmitting}
                          style={{
                            padding: '10px 0', background: '#2563eb', color: '#fff',
                            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', opacity: (!updateData.status || isSubmitting) ? 0.5 : 1,
                          }}
                        >
                          {isSubmitting ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <Divider />
                <button
                  onClick={() => setShowViewModal(false)}
                  style={{
                    padding: '10px 0', background: '#f3f4f6', color: '#374151',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </Modal>
          );
        })()}

      </div>
    </div>
  );
};

// ─── Small sub-components ─────────────────────────────────────────────────────

const DetailItem = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
    <span style={{ fontSize: 14, color: '#111827' }}>{children}</span>
  </div>
);

const Divider = () => (
  <hr style={{ margin: 0, border: 'none', borderTop: '1px solid #f3f4f6' }} />
);

export default Reports;