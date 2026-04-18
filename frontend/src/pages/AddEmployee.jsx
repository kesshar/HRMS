import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function AddEmployee() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    role: "",
    password: "",
    skills: "",
    walletAddress: "",
    customDepartment: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.department.trim()) {
      newErrors.department = "Department is required";
    } else if (formData.department === "Others" && !formData.customDepartment.trim()) {
      newErrors.customDepartment = "Please specify the department name";
    }

    if (!formData.role.trim()) {
      newErrors.role = "Role is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      const submissionData = {
        ...formData,
        department: formData.department === "Others" ? formData.customDepartment : formData.department,
        skills: formData.skills.split(",").map(skill => skill.trim()),
      };

      // Remove customDepartment before sending if not needed
      delete submissionData.customDepartment;
      await API.post("/employees", submissionData);
      navigate("/admin/employees");
    } catch (err) {
      console.error("Error adding employee:", err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || "Failed to add employee. Please try again.";
      setErrors({
        submit: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/employees");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-slate-500">
            <button
              onClick={() => navigate("/admin/employees")}
              className="hover:text-indigo-600 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Employees</span>
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700 font-medium">Add New Employee</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl lg:text-4xl font-light text-slate-800 tracking-tight">
              Add New
            </h1>
            <span className="text-3xl lg:text-4xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Employee
            </span>
          </div>
          <p className="text-slate-500 mt-3">
            Fill in the details below to add a new employee to your organization
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Form Header */}
          <div className="border-b border-slate-100 bg-slate-50/50 px-8 py-5">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Employee Information</h2>
                <p className="text-sm text-slate-500">Complete all required fields to create employee account</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-rose-600">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Personal Information Section */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-xs font-semibold text-indigo-600">1</span>
                  </span>
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                 focus:border-indigo-500 transition-all text-slate-700 
                                 placeholder:text-slate-400
                                 ${errors.name ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-rose-500 mt-1.5">{errors.name}</p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@company.com"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                 focus:border-indigo-500 transition-all text-slate-700 
                                 placeholder:text-slate-400
                                 ${errors.email ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-rose-500 mt-1.5">{errors.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Work Information Section */}
              <div className="pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-xs font-semibold text-indigo-600">2</span>
                  </span>
                  Work Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Department <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={`w-full pl-10 pr-10 py-3 bg-slate-50 border rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                 focus:border-indigo-500 transition-all appearance-none text-slate-700
                                 ${errors.department ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                      >
                        <option value="">Select Department</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Sales">Sales</option>
                        <option value="HR">Human Resources</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Others">Others (Enter manually)</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.department && (
                      <p className="text-sm text-rose-500 mt-1.5">{errors.department}</p>
                    )}

                    {/* Custom Department Input */}
                    {formData.department === "Others" && (
                      <div className="mt-4 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-slate-700">
                          Custom Department Name <span className="text-rose-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            name="customDepartment"
                            value={formData.customDepartment}
                            onChange={handleChange}
                            placeholder="Enter department name"
                            className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl 
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                     focus:border-indigo-500 transition-all text-slate-700 
                                     placeholder:text-slate-400
                                     ${errors.customDepartment ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                          />
                        </div>
                        {errors.customDepartment && (
                          <p className="text-sm text-rose-500 mt-1.5">{errors.customDepartment}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Role Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Role <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        placeholder="e.g., Senior Developer"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                 focus:border-indigo-500 transition-all text-slate-700 
                                 placeholder:text-slate-400
                                 ${errors.role ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.role && (
                      <p className="text-sm text-rose-500 mt-1.5">{errors.role}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Security Section */}
              <div className="pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-xs font-semibold text-indigo-600">3</span>
                  </span>
                  Account Security
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                 focus:border-indigo-500 transition-all text-slate-700 
                                 placeholder:text-slate-400
                                 ${errors.password ? 'border-rose-300 bg-rose-50/50' : 'border-slate-200'}`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-rose-500 mt-1.5">{errors.password}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">Minimum 6 characters</p>
                  </div>

                  {/* Wallet Address Field */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700">
                      Wallet Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="walletAddress"
                        value={formData.walletAddress}
                        onChange={handleChange}
                        placeholder="0x..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                                 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                                 focus:border-indigo-500 transition-all text-slate-700 
                                 placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              <div className="pt-4">
                <h3 className="text-sm font-medium text-slate-700 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center mr-2">
                    <span className="text-xs font-semibold text-indigo-600">4</span>
                  </span>
                  Skills & Expertise
                </h3>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Skills (comma-separated)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="React, Node.js, Python, UI/UX"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/20 
                               focus:border-indigo-500 transition-all text-slate-700 
                               placeholder:text-slate-400"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Enter skills separated by commas</p>
                </div>
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
                           bg-gradient-to-r from-indigo-600 to-purple-600 
                           rounded-xl hover:from-indigo-700 hover:to-purple-700 
                           transition-all flex items-center space-x-2
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-sm shadow-indigo-600/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Employee</span>
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

export default AddEmployee;