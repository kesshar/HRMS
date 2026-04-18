import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

const STATUS_CONFIG = {
  Approved:  { bg: "bg-emerald-50",  text: "text-emerald-700",  dot: "bg-emerald-500",  label: "Approved"  },
  Rejected:  { bg: "bg-red-50",      text: "text-red-700",      dot: "bg-red-500",      label: "Rejected"  },
  Pending:   { bg: "bg-amber-50",    text: "text-amber-700",    dot: "bg-amber-400",    label: "Pending"   },
};

const LEAVE_TYPE_COLOR = {
  CL: "text-violet-700 bg-violet-50 border-violet-200",
  SL: "text-sky-700 bg-sky-50 border-sky-200",
  PL: "text-teal-700 bg-teal-50 border-teal-200",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-sky-100 text-sky-700",
    "bg-teal-100 text-teal-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
  ];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${colors[idx]}`}>
      {initials}
    </div>
  );
}

function PolicyField({ label, abbr, value, onChange }) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{abbr}</span>
      </div>
      <div className="relative">
        <input
          type="number"
          required
          min="0"
          value={value}
          onChange={onChange}
          className="w-full border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
                     hover:border-gray-300 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
          days/yr
        </span>
      </div>
    </div>
  );
}

function LeaveCard({ req, onUpdateStatus }) {
  const leaveTypeKey = req.leaveType?.replace(/\s.*/,"") ?? "CL";
  const leaveColor = LEAVE_TYPE_COLOR[leaveTypeKey] ?? LEAVE_TYPE_COLOR.CL;

  const fmt = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <article className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={req.employeeId?.name} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {req.employeeId?.name ?? "Unknown Employee"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {req.employeeId?.email}
                {req.employeeId?.department && (
                  <span className="ml-1 before:content-['·'] before:mr-1">{req.employeeId.department}</span>
                )}
              </p>
            </div>
          </div>
          <StatusBadge status={req.status} />
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs bg-gray-50 rounded-lg p-3 mb-3">
          <div>
            <span className="text-gray-400 block mb-0.5">Leave type</span>
            <span className={`inline-block px-2 py-0.5 rounded border text-xs font-semibold ${leaveColor}`}>
              {req.leaveType}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">Duration</span>
            <span className="font-medium text-gray-800">
              {req.totalDays} {req.totalDays === 1 ? "day" : "days"}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">From</span>
            <span className="font-medium text-gray-800">{fmt(req.fromDate)}</span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">To</span>
            <span className="font-medium text-gray-800">{fmt(req.toDate)}</span>
          </div>
          {req.reason && (
            <div className="col-span-2 pt-1 border-t border-gray-200 mt-1">
              <span className="text-gray-400 block mb-0.5">Reason</span>
              <span className="text-gray-700 leading-relaxed">{req.reason}</span>
            </div>
          )}
        </div>

        {/* HR Remarks */}
        {req.hrRemarks && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3 border border-red-100">
            <svg className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 16 16">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" fill="currentColor"/>
              <path d="M8 4a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 7.5a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
            </svg>
            <span className="font-medium">{req.hrRemarks}</span>
          </div>
        )}

        {/* Actions */}
        {(req.status !== "Approved" || req.status !== "Rejected") && (
          <div className="flex gap-2">
            {req.status !== "Approved" && (
              <button
                onClick={() => onUpdateStatus(req._id, "Approved", req.status)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                           bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                           text-white text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
            )}
            {req.status !== "Rejected" && (
              <button
                onClick={() => onUpdateStatus(req._id, "Rejected", req.status)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                           border border-red-200 hover:bg-red-50 active:bg-red-100
                           text-red-600 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-600">No leave requests</p>
      <p className="text-xs text-gray-400 mt-1">Employee requests will appear here.</p>
    </div>
  );
}

const FILTERS = ["All", "Pending", "Approved", "Rejected"];

export default function AdminLeaves() {
  const [policy, setPolicy] = useState({ default_CL: 10, default_SL: 5, default_PL: 15 });
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [filter, setFilter] = useState("All");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [policyRes, leavesRes] = await Promise.all([
        API.get("/leaves/policy"),
        API.get("/leaves/all"),
      ]);
      setPolicy(policyRes.data);
      setLeaves(leavesRes.data);
    } catch (err) {
      console.error("Failed to fetch leave data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePolicySave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Updating policy will recalculate leave totals for ALL employees. Proceed?")) return;
    try {
      setSavingPolicy(true);
      await API.post("/leaves/policy", policy);
      alert("Policy updated and balances backfilled.");
    } catch (err) {
      const status = err.response?.status ?? "Network Error";
      alert(`Failed to save policy (${status}). Ensure the backend is running.`);
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleUpdateStatus = async (id, status, currentStatus) => {
    if (status === "Rejected" && currentStatus === "Approved") {
      if (!window.confirm("This leave is already approved. Rejecting it will refund the days to the employee. Proceed?")) return;
    }
    const hrRemarks = window.prompt("Remarks (optional):", "");
    if (hrRemarks === null) return;

    try {
      await API.patch(`/leaves/${id}/status`, { status, hrRemarks });
      fetchData();
    } catch {
      alert("Failed to update leave status. Please try again.");
    }
  };

  const counts = leaves.reduce(
    (acc, l) => ({ ...acc, [l.status]: (acc[l.status] ?? 0) + 1 }),
    { Pending: 0, Approved: 0, Rejected: 0 }
  );

  const filtered = filter === "All" ? leaves : leaves.filter((l) => l.status === filter);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Management</h1>
            <p className="text-sm text-gray-500 mt-1">Configure leave policies and review employee requests.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading data…</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* ── Left column: policy + stats ── */}
            <div className="space-y-4 lg:col-span-1">

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Pending",  value: counts.Pending,  color: "text-amber-600"  },
                  { label: "Approved", value: counts.Approved, color: "text-emerald-600" },
                  { label: "Rejected", value: counts.Rejected, color: "text-red-500"    },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center">
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Policy panel */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                  <h2 className="text-sm font-semibold text-gray-900">Global Leave Policy</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Applied to all employees on save.</p>
                </div>
                <form onSubmit={handlePolicySave} className="px-5 py-4 space-y-4">
                  <PolicyField
                    label="Casual leave"
                    abbr="CL"
                    value={policy.default_CL}
                    onChange={(e) => setPolicy({ ...policy, default_CL: Number(e.target.value) })}
                  />
                  <PolicyField
                    label="Sick leave"
                    abbr="SL"
                    value={policy.default_SL}
                    onChange={(e) => setPolicy({ ...policy, default_SL: Number(e.target.value) })}
                  />
                  <PolicyField
                    label="Privilege leave"
                    abbr="PL"
                    value={policy.default_PL}
                    onChange={(e) => setPolicy({ ...policy, default_PL: Number(e.target.value) })}
                  />
                  <button
                    type="submit"
                    disabled={savingPolicy}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700
                               active:bg-violet-800 disabled:opacity-60 disabled:cursor-not-allowed
                               text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
                  >
                    {savingPolicy ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Save &amp; Apply to All
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Right column: leave list ── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Employee Requests</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{leaves.length} total</p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                    {FILTERS.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          filter === f
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        {f}
                        {f !== "All" && counts[f] > 0 && (
                          <span className="ml-1.5 text-gray-400">{counts[f]}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  {filtered.length === 0 ? (
                    <EmptyState />
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[680px] overflow-y-auto pr-1">
                      {filtered.map((req) => (
                        <LeaveCard key={req._id} req={req} onUpdateStatus={handleUpdateStatus} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}