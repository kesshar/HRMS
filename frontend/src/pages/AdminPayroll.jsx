import { useState, useEffect } from "react";
import API from "../services/api";

export default function AdminPayroll() {
  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("structures");
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1);
  const [genYear, setGenYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [empRes, structRes, payRes] = await Promise.all([
        API.get("/employees"),
        API.get("/payroll/structure"),
        API.get("/payroll/all"),
      ]);
      setEmployees(empRes.data);
      setStructures(structRes.data);
      setPayrolls(payRes.data);
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStructure = async (employeeId, form) => {
    try {
      await API.post("/payroll/structure", { employeeId, ...form });
      alert("Saved structure");
      fetchData();
    } catch {
      alert("Error saving");
    }
  };

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${genMonth}/${genYear}?`)) return;
    try {
      const res = await API.post("/payroll/generate", { month: genMonth, year: genYear });
      alert(res.data.message);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || "Error generating payroll");
    }
  };

  const handleMarkPaid = async (id) => {
    if (!window.confirm("Confirm payment?")) return;
    try {
      await API.patch(`/payroll/${id}/mark-paid`);
      fetchData();
    } catch {
      alert("Error updating status");
    }
  };

  const totalGross = payrolls.reduce((s, p) => s + (p.grossSalary || 0), 0);
  const totalNet = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0);
  const paidCount = payrolls.filter((p) => p.status === "Paid").length;

  const tabs = [
    { id: "structures", label: "Salary Structures", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
    )},
    { id: "generate", label: "Generate Payroll", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
    )},
    { id: "records", label: "Payroll Records", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payroll Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure salaries, run monthly calculations, and manage payouts.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading payroll system...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                label="Total Employees"
                value={employees.length}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
                accent="indigo"
              />
              <SummaryCard
                label="Total Payrolls Processed"
                value={payrolls.length}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                }
                accent="violet"
              />
              <SummaryCard
                label="Paid This Cycle"
                value={paidCount}
                suffix={payrolls.length > 0 ? `/ ${payrolls.length}` : ""}
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                }
                accent="emerald"
              />
            </div>

            {/* Tabs + Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Tab Bar */}
              <div className="flex border-b border-gray-200 px-4 pt-2 gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150 -mb-px ${
                      activeTab === tab.id
                        ? "border-b-2 border-indigo-600 text-indigo-600 bg-indigo-50/60"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Salary Structures Tab */}
                {activeTab === "structures" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Basic (₹)</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">HRA (₹)</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Allowances (₹)</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Tax %</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">PF (₹)</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {employees.map((emp) => {
                          const struct = structures.find((s) => s.employeeId?._id === emp._id) || {
                            basic: 0, hra: 0, allowances: 0, taxPercent: 0, pf: 0,
                          };
                          return <StructureRow key={emp._id} employee={emp} initial={struct} onSave={handleSaveStructure} />;
                        })}
                        {employees.length === 0 && (
                          <tr><td colSpan="7" className="py-12 text-center text-gray-400 text-sm">No employees found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Generate Payroll Tab */}
                {activeTab === "generate" && (
                  <div className="max-w-md">
                    <div className="mb-5">
                      <h2 className="text-base font-semibold text-gray-900">Run Monthly Payroll Engine</h2>
                      <p className="text-sm text-gray-500 mt-0.5">Select the period and execute the payroll calculation algorithm.</p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Target Month</label>
                        <select
                          className="w-full border border-gray-200 bg-gray-50 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          value={genMonth}
                          onChange={(e) => setGenMonth(Number(e.target.value))}
                        >
                          {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Target Year</label>
                        <input
                          type="number"
                          className="w-full border border-gray-200 bg-gray-50 text-gray-900 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                          value={genYear}
                          onChange={(e) => setGenYear(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        <p className="text-xs font-medium leading-relaxed">Engine calculates: <span className="font-bold">(Gross / 30) × PresentDays</span>. LWP days will be deducted from net pay. Ensure attendance is complete before running.</p>
                      </div>
                      <button
                        onClick={handleGenerate}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl py-2.5 text-sm font-semibold tracking-wide transition-all duration-150 shadow-sm shadow-indigo-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Execute Generation Algorithm
                      </button>
                    </div>
                  </div>
                )}

                {/* Payroll Records Tab */}
                {activeTab === "records" && (
                  <div className="overflow-x-auto">
                    {/* Records Summary Row */}
                    {payrolls.length > 0 && (
                      <div className="flex gap-4 mb-5">
                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">Total Gross</p>
                          <p className="text-base font-bold text-gray-900 mt-0.5">₹{totalGross.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">Total Net Paid</p>
                          <p className="text-base font-bold text-emerald-600 mt-0.5">₹{totalNet.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">Total Deductions</p>
                          <p className="text-base font-bold text-red-500 mt-0.5">₹{(totalGross - totalNet).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    )}
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attendance</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Deductions</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Salary</th>
                          <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {payrolls.length === 0 ? (
                          <tr><td colSpan="7" className="py-12 text-center text-gray-400 text-sm">No payroll records found.</td></tr>
                        ) : payrolls.map((p) => (
                          <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-gray-900">{p.employeeId?.name || "Unknown"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.employeeId?.department}</p>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                                {String(p.month).padStart(2, "0")}/{p.year}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-xs space-y-0.5">
                              <p className="text-gray-600 font-medium">{p.presentDays} <span className="text-gray-400">/ {p.workingDays} days</span></p>
                              {p.LWP_days > 0 && (
                                <span className="inline-flex items-center gap-1 text-red-600 font-semibold">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                                  LWP: {p.LWP_days}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-gray-700 font-medium">₹{p.grossSalary?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="py-3.5 px-4 text-red-500 font-medium">−₹{p.totalDeductions?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="py-3.5 px-4 font-bold text-emerald-600">₹{p.netSalary?.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                            <td className="py-3.5 px-4">
                              {p.status === "Paid" ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                  Paid
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleMarkPaid(p._id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 active:scale-[0.97] rounded-lg text-xs font-semibold transition-all"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                  Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, suffix, icon, accent }) {
  const accents = {
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", ring: "ring-indigo-100" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", ring: "ring-violet-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
  };
  const a = accents[accent] || accents.indigo;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1 tracking-tight">
          {value}
          {suffix && <span className="text-lg font-medium text-gray-400 ml-1">{suffix}</span>}
        </p>
      </div>
      <div className={`w-12 h-12 rounded-xl ${a.bg} ${a.text} ring-1 ${a.ring} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
    </div>
  );
}

function StructureRow({ employee, initial, onSave }) {
  const [form, setForm] = useState({
    basic: initial.basic || 0,
    hra: initial.hra || 0,
    allowances: initial.allowances || 0,
    taxPercent: initial.taxPercent || 0,
    pf: initial.pf || 0,
  });

  const inputClass = "w-full border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition";

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4 font-semibold text-gray-900">{employee.name}</td>
      <td className="py-3 px-4"><input type="number" min="0" className={inputClass} value={form.basic} onChange={(e) => setForm({ ...form, basic: Number(e.target.value) })} /></td>
      <td className="py-3 px-4"><input type="number" min="0" className={inputClass} value={form.hra} onChange={(e) => setForm({ ...form, hra: Number(e.target.value) })} /></td>
      <td className="py-3 px-4"><input type="number" min="0" className={inputClass} value={form.allowances} onChange={(e) => setForm({ ...form, allowances: Number(e.target.value) })} /></td>
      <td className="py-3 px-4"><input type="number" min="0" max="100" className={inputClass} value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} /></td>
      <td className="py-3 px-4"><input type="number" min="0" className={inputClass} value={form.pf} onChange={(e) => setForm({ ...form, pf: Number(e.target.value) })} /></td>
      <td className="py-3 px-4">
        <button
          onClick={() => onSave(employee._id, form)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm shadow-indigo-200"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          Save
        </button>
      </td>
    </tr>
  );
}