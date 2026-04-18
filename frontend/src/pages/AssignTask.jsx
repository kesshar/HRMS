import { useState, useEffect } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

function AssignTask() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Task title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.assignedTo) {
      newErrors.assignedTo = "Please select an employee";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await API.post("/tasks", formData);
      navigate("/admin/tasks");
    } catch (error) {
      console.error("Error assigning task:", error);
      setErrors({
        submit: error.response?.data?.message || "Failed to assign task. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleCancel = () => {
    navigate("/admin/tasks");
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-slate-500">
            <button 
              onClick={() => navigate("/admin/tasks")}
              className="hover:text-indigo-600 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Tasks</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">Assign New Task</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">
            Assign New Task
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Create and assign tasks to team members
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Task Details</h2>
                <p className="text-sm text-slate-500">Fill in the information below</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {/* Error Alert */}
            {errors.submit && (
              <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-rose-600">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Task Title */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Task Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Design homepage, Fix login bug, Write documentation"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                           transition-all text-slate-700 placeholder:text-slate-400
                           ${errors.title ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                />
                {errors.title && (
                  <p className="text-sm text-rose-500 mt-1.5">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">
                  Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Provide detailed information about the task..."
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none 
                           focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                           transition-all text-slate-700 placeholder:text-slate-400 resize-none
                           ${errors.description ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                />
                {errors.description && (
                  <p className="text-sm text-rose-500 mt-1.5">{errors.description}</p>
                )}
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Priority Level
                  </label>
                  <div className="relative">
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                               focus:border-indigo-500 transition-all appearance-none
                               text-slate-700"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Due Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:outline-none 
                             focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                             transition-all text-slate-700
                             ${errors.dueDate ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-rose-500 mt-1.5">{errors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* Assign To Section */}
              <div className="space-y-3 pt-2">
                <label className="block text-sm font-medium text-slate-700">
                  Assign To <span className="text-rose-400">*</span>
                </label>
                
                {/* Search Employees */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search employees by name or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 
                             transition-all text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                {/* Employee List */}
                <div className={`border rounded-xl overflow-hidden transition-all
                              ${errors.assignedTo ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <label
                          key={emp._id}
                          className={`flex items-center px-4 py-3 cursor-pointer transition-colors
                                    hover:bg-slate-50
                                    ${formData.assignedTo === emp._id ? 'bg-indigo-50/50' : ''}`}
                        >
                          <input
                            type="radio"
                            name="assignedTo"
                            value={emp._id}
                            checked={formData.assignedTo === emp._id}
                            onChange={handleChange}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500/20"
                          />
                          <div className="ml-3 flex-1 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-700">{emp.name}</p>
                              <p className="text-xs text-slate-500">{emp.email}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                              {emp.department || 'No Dept'}
                            </span>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-100 rounded-full mb-3">
                          <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <p className="text-sm text-slate-500">No employees found</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                </div>
                {errors.assignedTo && (
                  <p className="text-sm text-rose-500 mt-1.5">{errors.assignedTo}</p>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 
                           hover:text-slate-800 bg-white border border-slate-200 
                           rounded-xl hover:bg-slate-50 transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-sm font-medium text-white 
                           bg-indigo-600 rounded-xl hover:bg-indigo-700 
                           transition-all flex items-center space-x-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-sm shadow-indigo-600/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Assign Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-slate-400 mt-4 text-center">
          Fields marked with <span className="text-rose-400">*</span> are required
        </p>
      </div>
    </div>
  );
}

export default AssignTask;