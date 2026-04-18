import { useEffect, useState, useMemo, useCallback } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // New states for enhanced features
  const [selectedTask, setSelectedTask] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  }, []);

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await API.get("/tasks");
      setTasks(res.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showToast("Failed to fetch tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await API.patch(`/tasks/${taskId}`, { status: newStatus });
      setTasks(tasks.map(task =>
        task._id === taskId ? { ...task, status: newStatus } : task
      ));
      showToast("Task status updated successfully");
    } catch (error) {
      console.error("Error updating task status:", error);
      showToast("Failed to update task status", "error");
    }
  };

  // Sorting function
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Filter and search logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = filter === "All" || task.status === filter;
      const matchesSearch =
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignedTo?.email?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }, [tasks, filter, searchTerm]);

  // Sorting logic
  const sortedTasks = useMemo(() => {
    const sortableTasks = [...filteredTasks];
    if (sortConfig.key) {
      sortableTasks.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle nested objects
        if (sortConfig.key === 'assignedTo') {
          aValue = a.assignedTo?.name || '';
          bValue = b.assignedTo?.name || '';
        }

        // Handle dates
        if (sortConfig.key === 'dueDate') {
          aValue = a.dueDate ? new Date(a.dueDate) : new Date(0);
          bValue = b.dueDate ? new Date(b.dueDate) : new Date(0);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableTasks;
  }, [filteredTasks, sortConfig]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedTasks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select all functionality
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(currentItems.map(task => task._id));
    }
    setSelectAll(!selectAll);
  };

  // Handle single task selection
  const handleSelectTask = (taskId) => {
    setSelectedTasks(prev => {
      const newSelected = prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId];

      setSelectAll(newSelected.length === currentItems.length && currentItems.length > 0);
      return newSelected;
    });
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      setDeleteLoading('bulk');
      await Promise.all(selectedTasks.map(taskId => API.delete(`/tasks/${taskId}`)));

      setTasks(tasks.filter(task => !selectedTasks.includes(task._id)));
      showToast(`Successfully deleted ${selectedTasks.length} tasks`);

      setSelectedTasks([]);
      setSelectAll(false);
      setShowBulkDeleteModal(false);
    } catch (error) {
      console.error("Error deleting tasks:", error);
      showToast("Failed to delete some tasks", "error");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Title', 'Description', 'Status', 'Assigned To', 'Email', 'Due Date', 'Created At'];
      const csvData = sortedTasks.map(task => [
        task.title,
        task.description || '',
        task.status,
        task.assignedTo?.name || 'Unassigned',
        task.assignedTo?.email || '',
        task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
        task.createdAt ? new Date(task.createdAt).toLocaleDateString() : ''
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Tasks exported successfully');
    } catch (error) {
      console.error("Error exporting tasks:", error);
      showToast('Failed to export tasks', 'error');
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  // Handle single delete
  const handleDelete = async () => {
    if (!taskToDelete) return;

    setDeleteLoading(taskToDelete._id);

    try {
      await API.delete(`/tasks/${taskToDelete._id}`);

      setTasks(tasks.filter(task => task._id !== taskToDelete._id));
      showToast(`Task "${taskToDelete.title}" deleted successfully!`);

      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Error deleting task:", error);

      let errorMessage = "Failed to delete task";
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = error.message;
      }

      showToast(errorMessage, "error");
    } finally {
      setDeleteLoading(null);
    }
  };

  const statusColors = {
    "Assigned": "bg-amber-50 text-amber-700 border-amber-200",
    "Pending": "bg-amber-50 text-amber-700 border-amber-200", // Fallback for old data
    "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
    "Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "Overdue": "bg-rose-50 text-rose-700 border-rose-200"
  };

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'Assigned' || t.status === 'Pending' || t.status === 'In Pending').length;
  const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress' || t.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 bg-indigo-50 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-slate-600 font-medium">Loading tasks...</p>
          <p className="text-sm text-slate-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-slide-up ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
          <div className="flex items-center space-x-2">
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal content remains the same */}
            <div className="bg-gradient-to-r from-rose-50 to-red-50 px-6 py-4 border-b border-rose-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Task</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the task:
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
                <p className="font-medium text-gray-900">{taskToDelete.title}</p>
                {taskToDelete.description && (
                  <p className="text-sm text-gray-600 mt-1">{taskToDelete.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                  <span>Assigned to: {taskToDelete.assignedTo?.name || 'Unassigned'}</span>
                  <span>Status: {taskToDelete.status}</span>
                </div>
              </div>
              <p className="text-sm text-rose-600">
                ⚠️ This will permanently delete this task and all associated data.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 
                         hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={deleteLoading === taskToDelete._id}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading === taskToDelete._id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg 
                         transition-colors text-sm font-medium flex items-center space-x-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading === taskToDelete._id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Task</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-gradient-to-r from-rose-50 to-red-50 px-6 py-4 border-b border-rose-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Multiple Tasks</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete <span className="font-semibold">{selectedTasks.length}</span> selected tasks?
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4 max-h-60 overflow-y-auto">
                {tasks.filter(task => selectedTasks.includes(task._id)).map(task => (
                  <div key={task._id} className="py-2 border-b last:border-0 border-gray-200">
                    <p className="font-medium text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500">Assigned to: {task.assignedTo?.name || 'Unassigned'}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-rose-600">
                ⚠️ This will permanently delete all selected tasks and their associated data.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 
                         hover:bg-gray-50 transition-colors text-sm font-medium"
                disabled={deleteLoading === 'bulk'}
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={deleteLoading === 'bulk'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg 
                         transition-colors text-sm font-medium flex items-center space-x-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading === 'bulk' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete {selectedTasks.length} Tasks</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showDetailsModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100 sticky top-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Task Details</h3>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Task Title */}
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Title</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{selectedTask.title}</p>
              </div>

              {/* Description */}
              {selectedTask.description && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                  <div className="mt-2">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusColors[selectedTask.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
                {selectedTask.priority && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</label>
                    <div className="mt-2">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${selectedTask.priority === 'High' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          selectedTask.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</label>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                                  flex items-center justify-center text-white font-medium text-sm">
                      {selectedTask.assignedTo?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{selectedTask.assignedTo?.name || 'Unassigned'}</p>
                      <p className="text-xs text-gray-500">{selectedTask.assignedTo?.email || 'No email'}</p>
                    </div>
                  </div>
                </div>
                {selectedTask.assignedBy && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</label>
                    <p className="mt-2 text-sm text-gray-900">{selectedTask.assignedBy.name}</p>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</label>
                  <p className="mt-2 text-sm text-gray-900">
                    {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</label>
                  <p className="mt-2 text-sm text-gray-900">
                    {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : '—'}
                  </p>
                </div>
              </div>

              {/* Additional Metadata */}
              {selectedTask.category && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTask.category}</p>
                </div>
              )}

              {/* Attachments (if any) */}
              {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attachments</label>
                  <div className="mt-2 space-y-2">
                    {selectedTask.attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-gray-600">{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments/Notes */}
              {selectedTask.notes && selectedTask.notes.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</label>
                  <div className="mt-2 space-y-2">
                    {selectedTask.notes.map((note, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          By {note.author?.name || 'Unknown'} • {new Date(note.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3 sticky bottom-0">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 
                         hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  navigate(`/admin/edit-task/${selectedTask._id}`);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg 
                         transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit Task</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl lg:text-4xl font-light text-slate-800 tracking-tight">
                  Task
                </h1>
                <span className="text-3xl lg:text-4xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Management
                </span>
              </div>
              <p className="text-slate-500 mt-3">
                Monitor and manage all tasks across your organization
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {selectedTasks.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="bg-rose-600 text-white px-6 py-3 rounded-xl 
                           hover:bg-rose-700 transition-all duration-300 
                           hover:shadow-lg flex items-center space-x-2 font-medium
                           shadow-sm shadow-rose-600/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete Selected ({selectedTasks.length})</span>
                </button>
              )}

              <button
                onClick={exportToCSV}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl 
                         hover:bg-emerald-700 transition-all duration-300 
                         hover:shadow-lg flex items-center space-x-2 font-medium
                         shadow-sm shadow-emerald-600/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => navigate("/admin/assign-task")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl 
                         hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 
                         hover:shadow-lg flex items-center space-x-2 font-medium whitespace-nowrap
                         shadow-sm shadow-indigo-600/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Assign New Task</span>
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Tasks</p>
                  <p className="text-3xl font-bold text-slate-800 mt-2">{totalTasks}</p>
                </div>
                <div className="bg-indigo-100 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">All tasks in system</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Completed</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{completedTasks}</p>
                </div>
                <div className="bg-emerald-100 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">{Math.round((completedTasks / totalTasks) * 100) || 0}% completion rate</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">In Progress</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{inProgressTasks}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">Active tasks</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Pending</p>
                  <p className="text-3xl font-bold text-amber-600 mt-2">{pendingTasks}</p>
                </div>
                <div className="bg-amber-100 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">Not started</span>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Overdue</p>
                  <p className="text-3xl font-bold text-rose-600 mt-2">{overdueTasks}</p>
                </div>
                <div className="bg-rose-100 p-3 rounded-xl">
                  <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400">Requires attention</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks by title, employee, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                         transition-all text-slate-700 placeholder:text-slate-400"
                aria-label="Search tasks"
              />
            </div>

            <div className="relative">
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                         transition-all appearance-none text-slate-700"
                aria-label="Filter by status"
              >
                <option value="All">All Status</option>
                <option value="Assigned">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Overdue">Overdue</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <button
              onClick={() => {
                setSearchTerm("");
                setFilter("All");
                setCurrentPage(1);
              }}
              className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 
                       hover:bg-slate-100 transition-all font-medium flex items-center justify-center space-x-2"
              aria-label="Clear filters"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Clear Filters</span>
            </button>
          </div>

          {/* Quick Status Filters */}
          <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label="Quick status filters">
            {[
              { label: "All", value: "All", color: "indigo" },
              { label: "Pending", value: "Pending", color: "amber" },
              { label: "In Progress", value: "In Progress", color: "blue" },
              { label: "Completed", value: "Completed", color: "emerald" },
              { label: "Overdue", value: "Overdue", color: "rose" },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border
                  ${filter === status.value
                    ? `bg-${status.color}-500 text-white border-${status.color}-500 shadow-sm`
                    : `bg-${status.color}-50 text-${status.color}-600 border-${status.color}-100 hover:bg-${status.color}-100`
                  }`}
                aria-pressed={filter === status.value}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Results summary */}
          <div className="mt-4 text-sm text-slate-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedTasks.length)} of {sortedTasks.length} tasks
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      aria-label="Select all tasks"
                    />
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('assignedTo')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Employee</span>
                      {sortConfig.key === 'assignedTo' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Task Details</span>
                      {sortConfig.key === 'title' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Status</span>
                      {sortConfig.key === 'status' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                    onClick={() => handleSort('dueDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Due Date</span>
                      {sortConfig.key === 'dueDate' && (
                        <span className="ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((task) => (
                    <tr
                      key={task._id}
                      className={`hover:bg-slate-50/80 transition-colors duration-200 group ${selectedTasks.includes(task._id) ? 'bg-indigo-50/50' : ''
                        }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task._id)}
                          onChange={() => handleSelectTask(task._id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          aria-label={`Select task ${task.title}`}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 
                                          flex items-center justify-center text-white font-medium shadow-sm">
                              {task.assignedTo?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-800">
                              {task.assignedTo?.name || 'Unassigned'}
                            </div>
                            <div className="text-xs text-slate-500">
                              {task.assignedTo?.email || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleViewTask(task)}
                          className="text-left hover:text-indigo-600 transition-colors"
                          aria-label={`View details of ${task.title}`}
                        >
                          <div className="text-sm font-medium text-slate-800 group-hover:text-indigo-600">
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</div>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border
                                   ${statusColors[task.status] || 'bg-slate-50 text-slate-600 border-slate-200'} 
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
                                   cursor-pointer appearance-none pr-8 bg-no-repeat`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1rem'
                          }}
                          aria-label={`Change status for ${task.title}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Overdue">Overdue</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium
                          ${task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed'
                            ? 'text-rose-600'
                            : 'text-slate-600'
                          }`}>
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewTask(task)}
                            className="p-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 
                                     hover:bg-indigo-100 rounded-lg transition-colors duration-200
                                     border border-indigo-100 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="View task details"
                            aria-label={`View details of ${task.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigate(`/edit-task/${task._id}`)}
                            className="p-2 text-indigo-600 hover:text-indigo-700 bg-indigo-50 
                                     hover:bg-indigo-100 rounded-lg transition-colors duration-200
                                     border border-indigo-100 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            title="Edit task"
                            aria-label={`Edit ${task.title}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(task)}
                            disabled={deleteLoading === task._id}
                            className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 
                                     hover:bg-rose-100 rounded-lg transition-colors duration-200
                                     border border-rose-100 opacity-0 group-hover:opacity-100 focus:opacity-100
                                     disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete task"
                            aria-label={`Delete ${task.title}`}
                          >
                            {deleteLoading === task._id ? (
                              <div className="w-4 h-4 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <p className="text-slate-600 text-lg font-medium">No tasks found</p>
                        <p className="text-slate-400 mt-1">Try adjusting your search or filter</p>
                        <button
                          onClick={() => navigate("/assign-task")}
                          className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl 
                                   hover:bg-indigo-700 transition-colors flex items-center space-x-2
                                   shadow-sm shadow-indigo-600/20"
                          aria-label="Assign new task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Assign New Task</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {sortedTasks.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-slate-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedTasks.length)} of {sortedTasks.length} tasks
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium
                           text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                  aria-label="Previous page"
                >
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    // Show first page, last page, and pages around current page
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors
                            ${currentPage === pageNumber
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                          aria-label={`Page ${pageNumber}`}
                          aria-current={currentPage === pageNumber ? 'page' : undefined}
                        >
                          {pageNumber}
                        </button>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <span key={pageNumber} className="text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium
                           text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-4 text-xs text-slate-400 text-center">
          <span className="inline-flex items-center space-x-4">
            <span>⌘/Ctrl + F: Search</span>
            <span>•</span>
            <span>Esc: Clear selection</span>
            <span>•</span>
            <span>Tab: Navigate</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default Tasks;