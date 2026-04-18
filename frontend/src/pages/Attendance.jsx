import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [stats, setStats] = useState(null);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Token and API_URL are handled by the API service

  useEffect(() => {
    checkAdminStatus();
    fetchTodayAttendance();
    fetchMyAttendance();
    if (isAdmin) {
      fetchEmployees();
      fetchAllAttendance();
      fetchStats();
    }
    getLocation();
  }, [isAdmin]);

  const checkAdminStatus = () => {
    const userRole = localStorage.getItem('userRole')?.toUpperCase();
    setIsAdmin(userRole === 'ADMIN' || userRole === 'HR');
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await API.get('/attendance/today');
      setTodayAttendance(response.data);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const response = await API.get(`/attendance/my-attendance?startDate=${startDate}&endDate=${endDate}`);
      setAttendance(response.data.attendance);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      const startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
      const endDate = format(new Date(), 'yyyy-MM-dd');
      const response = await API.get(`/attendance/all?startDate=${startDate}&endDate=${endDate}`);
      setAttendance(response.data.attendance);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching all attendance:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const response = await API.get(`/attendance/stats?startDate=${startDate}&endDate=${endDate}`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const checkIn = async () => {
    try {
      await API.post('/attendance/check-in', location);
      fetchTodayAttendance();
      fetchMyAttendance();
    } catch (error) {
      console.error('Error checking in:', error);
    }
  };

  const checkOut = async () => {
    try {
      await API.post('/attendance/check-out', location);
      fetchTodayAttendance();
      fetchMyAttendance();
    } catch (error) {
      console.error('Error checking out:', error);
    }
  };

  const addManualAttendance = async () => {
    try {
      const data = {
        employeeId: selectedEmployee,
        date: selectedDate,
        checkInTime,
        checkOutTime,
        status,
        notes
      };

      await API.post('/attendance/manual', data);

      setShowManualModal(false);
      setSelectedEmployee('');
      setSelectedDate('');
      setCheckInTime('');
      setCheckOutTime('');
      setStatus('present');
      setNotes('');
      fetchAllAttendance();
    } catch (error) {
      console.error('Error adding manual attendance:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'half_day': return 'bg-orange-100 text-orange-800';
      case 'holiday': return 'bg-blue-100 text-blue-800';
      case 'leave': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin/qr-attendance"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 3.5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                </svg>
                QR Attendance
              </Link>
            )}
            {isAdmin && (
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Manual Entry
              </button>
            )}
          </div>
        </div>

        {/* Today's Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Attendance</h2>
          {todayAttendance ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(todayAttendance.status)}`}>
                    {todayAttendance.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {todayAttendance.checkIn && (
                  <div>
                    <p className="text-sm text-gray-500">Check In</p>
                    <p className="font-medium">{format(new Date(todayAttendance.checkIn.time), 'HH:mm')}</p>
                  </div>
                )}
                {todayAttendance.checkOut && (
                  <div>
                    <p className="text-sm text-gray-500">Check Out</p>
                    <p className="font-medium">{format(new Date(todayAttendance.checkOut.time), 'HH:mm')}</p>
                  </div>
                )}
                {todayAttendance.totalHours > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Total Hours</p>
                    <p className="font-medium">{todayAttendance.totalHours}h</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                {!todayAttendance.checkIn && (
                  <button
                    onClick={checkIn}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Check In
                  </button>
                )}
                {todayAttendance.checkIn && !todayAttendance.checkOut && (
                  <button
                    onClick={checkOut}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Check Out
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-gray-500">No attendance record for today</p>
              <button
                onClick={checkIn}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Check In
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {isAdmin && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Days</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalDays}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Present</h3>
              <p className="text-2xl font-bold text-green-600">
                {stats.stats.find(s => s._id === 'present')?.count || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Late</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.stats.find(s => s._id === 'late')?.count || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Absent</h3>
              <p className="text-2xl font-bold text-red-600">
                {stats.stats.find(s => s._id === 'absent')?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              {isAdmin ? 'All Employees Attendance' : 'My Attendance'}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record._id}>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={record.employee?.profileImage || 'https://via.placeholder.com/40'}
                            alt={record.employee?.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <div className="text-sm font-medium text-gray-900">
                            {record.employee?.name}
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.date && !isNaN(new Date(record.date)) ? format(new Date(record.date), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkIn?.time && !isNaN(new Date(record.checkIn.time)) ? format(new Date(record.checkIn.time), 'HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.checkOut?.time && !isNaN(new Date(record.checkOut.time)) ? format(new Date(record.checkOut.time), 'HH:mm') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalHours ? `${record.totalHours}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.manualEntry && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                            Manual
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Manual Entry Modal */}
        {showManualModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Add Manual Attendance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option key={employee._id} value={employee._id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check In Time
                    </label>
                    <input
                      type="datetime-local"
                      value={checkInTime}
                      onChange={(e) => setCheckInTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check Out Time
                    </label>
                    <input
                      type="datetime-local"
                      value={checkOutTime}
                      onChange={(e) => setCheckOutTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="holiday">Holiday</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Add notes..."
                  />
                </div>
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={addManualAttendance}
                  disabled={!selectedEmployee || !selectedDate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Add Entry
                </button>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
