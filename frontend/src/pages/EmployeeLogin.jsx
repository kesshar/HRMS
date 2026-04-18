// src/pages/EmployeeLogin.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../services/api";

function EmployeeLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [activeField, setActiveField] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!email) newErrors.email = "Required";
    if (!password) newErrors.password = "Required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const { data } = await API.post("/employee-auth/login", {
        email,
        password,
      });

      localStorage.setItem("employeeToken", data.token);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userId", data._id);
      navigate("/employee/dashboard");
    } catch (err) {
      setErrors({
        general: "Invalid credentials"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-700 p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/20 rounded-full translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-emerald-600 font-bold text-xl">Z</span>
            </div>
            <span className="text-white text-2xl font-semibold">Zenith HR</span>
          </Link>

          <div className="mt-16">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Welcome back,<br />Employee
            </h1>
            <p className="text-emerald-100 mt-4 text-lg">
              Access your tasks, track attendance, and manage your work life.
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-white/90 text-sm italic">
              "Having all my work info in one place makes my day so much easier. Love the simplicity!"
            </p>
            <div className="flex items-center mt-4">
              <div className="w-10 h-10 bg-emerald-400 rounded-full flex items-center justify-center text-white font-semibold">
                MP
              </div>
              <div className="ml-3">
                <p className="text-white font-medium">Michael Patel</p>
                <p className="text-emerald-200 text-xs">Software Engineer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-emerald-200 text-sm">
          © 2024 Zenith HR. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">Z</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Zenith HR</span>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Employee sign in</h2>
            <p className="text-gray-600 mt-2">
              Use your work credentials to access your account
            </p>
          </div>

          {/* Error Alert */}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: null });
                }}
                className={`w-full px-4 py-3 border ${errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition`}
                placeholder="you@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: null });
                  }}
                  className={`w-full px-4 py-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition pr-12`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600 hover:text-emerald-700"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-gray-500">Different role?</span>
            </div>
          </div>

          {/* Admin Link */}
          <div className="text-center">
            <Link
              to="/admin-login"
              className="inline-flex items-center text-gray-600 hover:text-emerald-600 transition"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Admin sign in
            </Link>
          </div>
        </div>
      </div>

      {/* Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset password</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please contact your HR department for password reset assistance.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700">HR Department</p>
              <p className="text-sm text-gray-600 mt-1">hr@company.com</p>
              <button
                onClick={() => navigator.clipboard.writeText("hr@company.com")}
                className="text-xs text-emerald-600 hover:text-emerald-700 mt-2"
              >
                Copy email
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeLogin;