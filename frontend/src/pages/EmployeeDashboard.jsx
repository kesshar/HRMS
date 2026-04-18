import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { getContract } from "../contracts/utils/contract";

function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [productivity, setProductivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [wallet, setWallet] = useState(null);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [myPerformance, setMyPerformance] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setWallet(accounts[0]);
  };

  const token = localStorage.getItem("employeeToken");

  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  useEffect(() => {
    setGreeting(getGreeting());
    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchTasks(), fetchProductivity(), fetchLeaves(), fetchPerformance()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await API.get("/leaves/summary", config);
      setLeaveSummary(res.data.summary);
    } catch (error) {
      console.log("Could not load leave summary");
    }
  };

  const fetchPerformance = async () => {
    try {
      const mn = new Date().getMonth() + 1;
      const yr = new Date().getFullYear();
      const res = await API.get(`/performance/my?month=${mn}&year=${yr}`, config);
      setMyPerformance(res.data);
    } catch (error) {
      console.log("Performance not yet generated for this month");
    }
  };

  const fetchTasks = async () => {
    const res = await API.get("/tasks/my-tasks", config);
    setTasks(res.data);
  };

  const fetchProductivity = async () => {
    const res = await API.get("/tasks/productivity", config);
    setProductivity(res.data);
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      setUpdatingTaskId(taskId);

      // 1️⃣ Update MongoDB first
      await API.put(
        `/tasks/${taskId}/status`,
        { status: newStatus },
        config
      );

      // 2️⃣ If status is Completed → log on blockchain
      if (newStatus === "Completed") {
        if (!wallet) {
          alert("Please connect your wallet first");
          return;
        }

        const contract = await getContract();
        const tx = await contract.logTask(taskId);
        await tx.wait();

        console.log("Blockchain TX:", tx.hash);
        alert("Task recorded on blockchain!");
      }

      await fetchDashboardData();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "In Progress":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Assigned":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "Completed").length;
  const inProgressTasks = tasks.filter(t => t.status === "In Progress").length;
  const assignedTasks = tasks.filter(t => t.status === "Assigned").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Greeting */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-light text-slate-800 tracking-tight">
                {greeting}, <span className="font-medium text-emerald-600">Employee</span>
              </h1>
              <p className="text-slate-500 mt-2">
                Here's an overview of your tasks and productivity
              </p>
            </div>

            {/* Date Display */}
            <div className="hidden md:block text-right">
              <p className="text-sm text-slate-400">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {!wallet ? (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
            >
              Connect Wallet
            </button>
          ) : (
            <p className="text-sm text-emerald-600">
              Wallet Connected: {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {/* Productivity Score Card */}
          {productivity && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Productivity
                    </p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">
                      {productivity.productivityScore}%
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Overall performance
                    </p>
                  </div>
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Completed
                    </p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      {productivity.completedTasks}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Out of {productivity.totalTasks} total
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Additional Stats */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  In Progress
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-2">
                  {inProgressTasks}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Active tasks
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Pending
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {assignedTasks}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Not started
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          {myPerformance && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    My Rating
                  </p>
                  <p className="text-3xl font-bold text-indigo-600 mt-2">
                    {myPerformance.record?.finalScore?.toFixed(0)} <span className="text-sm text-slate-400">pts</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Global Rank: <span className="text-emerald-500 font-bold">#{myPerformance.rank}</span>
                  </p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-xl cursor-pointer hover:bg-indigo-200 transition">
                  <Link to="/employee/leaderboard">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Leaves Stats */}
          {leaveSummary && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                    Leaves
                  </p>
                  <p className="text-3xl font-bold text-rose-600 mt-2">
                    {leaveSummary.totalTaken}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Taken <span className="text-emerald-500 font-medium">({leaveSummary.pendingCount} Pending)</span>
                  </p>
                </div>
                <div className="bg-rose-100 p-3 rounded-xl cursor-pointer hover:bg-rose-200 transition">
                  <Link to="/employee/leaves">
                    <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/employee/report-abuse" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all group hover:border-red-200 block">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-500 transition-colors">
                  <svg className="w-6 h-6 text-red-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Report an Issue</h3>
                  <p className="text-sm text-slate-500 mt-1">File a harassment or system issue report.</p>
                </div>
              </div>
            </Link>

            <Link to="/employee/chat" className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all group hover:border-blue-200 block">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <svg className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Team Chat</h3>
                  <p className="text-sm text-slate-500 mt-1">Communicate with peers or contact Admin.</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Section Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">My Tasks</h2>
                  <p className="text-sm text-slate-500">
                    You have {totalTasks} assigned task{totalTasks !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Task Summary Pills */}
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                  {completedTasks} done
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                  {inProgressTasks} active
                </span>
              </div>
            </div>
          </div>

          {/* Tasks Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Update Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className={`w-2 h-2 rounded-full mt-1.5 ${task.status === "Completed" ? "bg-emerald-500" :
                              task.status === "In Progress" ? "bg-blue-500" :
                                "bg-amber-500"
                              }`}></div>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-slate-800">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={task.status}
                            onChange={(e) => updateStatus(task._id, e.target.value)}
                            disabled={updatingTaskId === task._id}
                            className="w-40 px-3 py-2 bg-slate-50 border border-slate-200 
                                     rounded-lg focus:outline-none focus:ring-2 
                                     focus:ring-emerald-500/20 focus:border-emerald-500 
                                     transition-all text-sm text-slate-700
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     appearance-none cursor-pointer"
                          >
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                          {updatingTaskId === task._id && (
                            <div className="absolute right-8 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                            </div>
                          )}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-slate-600 font-medium">No tasks assigned yet</p>
                        <p className="text-sm text-slate-400 mt-1">
                          Your tasks will appear here once assigned
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-8 bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-emerald-800">Quick Tip</h3>
              <p className="text-sm text-emerald-600 mt-1">
                Update your task status regularly to help track your productivity.
                Tasks marked as "In Progress" show active work, while "Completed"
                tasks contribute to your productivity score.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;