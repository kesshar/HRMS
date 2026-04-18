import { useState, useEffect } from "react";
import API from "../services/api";

export default function EmployeeLeaves() {
  const [data, setData] = useState({ balance: null, history: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  
  const [form, setForm] = useState({ leaveType: "CL", fromDate: "", toDate: "", reason: "" });

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await API.get("/leaves/summary");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching leave summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await API.post("/leaves/apply", form);
      setShowApply(false);
      setForm({ leaveType: "CL", fromDate: "", toDate: "", reason: "" });
      fetchSummary();
    } catch (error) {
      alert("Error applying for leave.");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Leaves</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your time off and view leave balances.</p>
        </div>
        <button 
          onClick={() => setShowApply(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200 shadow-sm font-medium"
        >
          + Request Leave
        </button>
      </div>

      {loading || !data.balance ? (
        <p>Loading your leave records...</p>
      ) : (
        <div className="space-y-6">
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CL */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-700">Casual Leave (CL)</h3>
                <span className={`w-3 h-3 rounded-full ${data.balance.CL_total - data.balance.CL_used > 2 ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
              <p className="text-3xl font-black text-gray-900">{Math.max(0, data.balance.CL_total - data.balance.CL_used)}<span className="text-sm font-normal text-gray-500 ml-1">remaining</span></p>
              <p className="text-xs text-gray-500 mt-2">Used: {data.balance.CL_used} / {data.balance.CL_total}</p>
            </div>
            
            {/* SL */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-700">Sick Leave (SL)</h3>
                <span className={`w-3 h-3 rounded-full ${data.balance.SL_total - data.balance.SL_used > 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
              <p className="text-3xl font-black text-gray-900">{Math.max(0, data.balance.SL_total - data.balance.SL_used)}<span className="text-sm font-normal text-gray-500 ml-1">remaining</span></p>
              <p className="text-xs text-gray-500 mt-2">Used: {data.balance.SL_used} / {data.balance.SL_total}</p>
            </div>

            {/* PL */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-gray-700">Privilege Leave (PL)</h3>
                <span className={`w-3 h-3 rounded-full ${data.balance.PL_total - data.balance.PL_used > 3 ? 'bg-green-500' : 'bg-red-500'}`}></span>
              </div>
              <p className="text-3xl font-black text-gray-900">{Math.max(0, data.balance.PL_total - data.balance.PL_used)}<span className="text-sm font-normal text-gray-500 ml-1">remaining</span></p>
              <p className="text-xs text-gray-500 mt-2">Used: {data.balance.PL_used} / {data.balance.PL_total}</p>
            </div>

            {/* Overall Summary */}
            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100 shadow-sm">
              <h3 className="font-bold text-indigo-900 mb-2">Overview</h3>
              <div className="flex justify-between text-indigo-800 text-sm mb-1">
                <span>Total Leaves Taken:</span>
                <span className="font-bold">{data.summary.totalTaken}</span>
              </div>
              <div className="flex justify-between text-indigo-800 text-sm">
                <span>Pending Requests:</span>
                <span className="font-bold">{data.summary.pendingCount}</span>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold mb-4">Leave Application History</h2>
            {data.history.length === 0 ? (
              <p className="text-gray-500">No past leave applications.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600 divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3 px-4 font-semibold text-gray-700">Type</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Duration</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Days</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="py-3 px-4 font-semibold text-gray-700">HR Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.history.map(req => (
                      <tr key={req._id} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="py-3 px-4 font-medium text-gray-900">{req.leaveType}</td>
                        <td className="py-3 px-4">{new Date(req.fromDate).toLocaleDateString()} to {new Date(req.toDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">{req.totalDays}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            req.status === 'Approved' ? 'bg-green-100 text-green-800' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">{req.hrRemarks || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-indigo-600 border-b border-indigo-700 text-white">
              <h2 className="text-xl font-bold">Request Leave</h2>
              <p className="text-xs text-indigo-200 mt-1">Leaves exceeding your balance will be auto-rejected unless LWP.</p>
            </div>
            <form onSubmit={handleApply} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Leave Type</label>
                <select required className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}>
                  <option value="CL">Casual Leave (CL)</option>
                  <option value="SL">Sick Leave (SL)</option>
                  <option value="PL">Privilege Leave (PL)</option>
                  <option value="LWP">Leave Without Pay (LWP)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">From Date</label>
                  <input type="date" min={today} required className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    value={form.fromDate} onChange={e => setForm({...form, fromDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date</label>
                  <input type="date" min={form.fromDate || today} required className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                    value={form.toDate} onChange={e => setForm({...form, toDate: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea required rows="3" className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500"
                  placeholder="Explain your reason..."
                  value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowApply(false)} className="px-4 py-2 font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200">Cancel</button>
                <button type="submit" className="px-4 py-2 font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-all duration-200">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
