import { useEffect, useState } from "react";
import API from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setGreeting(getGreeting());
    fetchStats();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Auto refresh every 10 seconds (more reasonable than 3s)
    const refreshInterval = setInterval(() => {
      fetchStats();
    }, 10000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(refreshInterval);
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get("/dashboard/stats");
      setStats(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const pendingTasks = stats.totalTasks - stats.completedTasks;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {greeting}, <span className="text-indigo-600">Admin</span>
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Here's what's happening with your workspace
              </p>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{formatDate()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatTime()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {stats.totalEmployees?.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {stats.totalTasks?.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {stats.completedTasks?.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Progress & Departments Section */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Completion Card - Enhanced */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Card Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Task Completion</h2>
                    <p className="text-xs text-gray-500">Track your team's progress</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium">
                  {completionRate}% complete
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Main Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Overall completion</span>
                  <span className="font-semibold text-gray-900">{completionRate}%</span>
                </div>
                <div className="relative">
                  {/* Background bar */}
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                    {/* Progress fill */}
                    <div
                      style={{ width: `${completionRate}%` }}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all duration-700 ease-out relative"
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  {/* Marker dots for visual interest */}
                  <div className="absolute -bottom-1 w-full flex justify-between px-1">
                    {[0, 25, 50, 75, 100].map((mark) => (
                      <div
                        key={mark}
                        className={`w-1 h-1 rounded-full ${completionRate >= mark ? 'bg-indigo-400' : 'bg-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mt-8">
                {/* Completed Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">Completed</p>
                      <p className="text-2xl font-bold text-emerald-800 mt-1">{stats.completedTasks}</p>
                      <p className="text-xs text-emerald-600 mt-1">
                        {completionRate}% of total
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Pending Card */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 border border-amber-200/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-700 uppercase tracking-wider">Pending</p>
                      <p className="text-2xl font-bold text-amber-800 mt-1">{pendingTasks}</p>
                      <p className="text-xs text-amber-600 mt-1">
                        {100 - completionRate}% remaining
                      </p>
                    </div>
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini Task Distribution */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-gray-600 font-medium">Task distribution</span>
                  <span className="text-xs text-gray-500">by status</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completionRate}%` }}
                    className="bg-emerald-500 h-full"
                    title={`Completed: ${stats.completedTasks}`}
                  />
                  <div
                    style={{ width: `${100 - completionRate}%` }}
                    className="bg-amber-400 h-full"
                    title={`Pending: ${pendingTasks}`}
                  />
                </div>
                <div className="flex justify-between mt-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600">Completed ({stats.completedTasks})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                    <span className="text-gray-600">Pending ({pendingTasks})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Departments Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Departments</h2>
                  <p className="text-xs text-gray-500">{stats.totalEmployees} total employees</p>
                </div>
              </div>
            </div>

            {/* Departments List */}
            <div className="p-6">
              {stats.departments && stats.departments.length > 0 ? (
                <div className="space-y-4">
                  {stats.departments.map((dept, index) => {
                    const percentage = Math.round((dept.count / stats.totalEmployees) * 100);
                    return (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-indigo-500' :
                                index === 1 ? 'bg-purple-500' :
                                  index === 2 ? 'bg-emerald-500' :
                                    'bg-amber-500'
                              }`} />
                            <span className="text-gray-700">{dept._id || "Unassigned"}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">{dept.count}</span>
                            <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${percentage}%` }}
                            className={`h-1.5 rounded-full ${index === 0 ? 'bg-indigo-500' :
                                index === 1 ? 'bg-purple-500' :
                                  index === 2 ? 'bg-emerald-500' :
                                    'bg-amber-500'
                              }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm text-gray-500">No departments found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-4 text-right">
          <span className="text-xs text-gray-400 inline-flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
            Live updates every 10s
          </span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
