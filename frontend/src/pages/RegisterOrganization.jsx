import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function RegisterOrganization() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    industry: "",
    companySize: "",
    adminName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/org/register", form);
      navigate("/admin-login", { 
        state: { message: "Registration successful! Please login." } 
      });
    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
      
      {/* Header with Logo */}
      <nav className="pt-8 px-6">
        <div className="max-w-7xl mx-auto">
          <Link to="/" className="flex items-center space-x-2 w-fit">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg"></div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ZENITH HR
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    step >= i 
                      ? 'border-indigo-600 bg-indigo-600 text-white' 
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    {step > i ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i
                    )}
                  </div>
                  {i < 3 && (
                    <div className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                      step > i ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 px-2">
              <span className="text-xs font-medium text-gray-600">Company</span>
              <span className="text-xs font-medium text-gray-600">Admin</span>
              <span className="text-xs font-medium text-gray-600">Review</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white">Get Started with Zenith HR</h2>
              <p className="text-indigo-100 mt-1 text-sm">Join 5000+ companies simplifying HR management</p>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Step 1: Company Details */}
              {step === 1 && (
                <div className="space-y-5 animate-fadeIn">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={form.companyName}
                      onChange={handleChange}
                      placeholder="e.g., Acme Inc."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="contact@company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <select
                        name="industry"
                        value={form.industry}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                      >
                        <option value="">Select Industry</option>
                        <option value="technology">Technology</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="finance">Finance</option>
                        <option value="education">Education</option>
                        <option value="retail">Retail</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size
                      </label>
                      <select
                        name="companySize"
                        value={form.companySize}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white"
                      >
                        <option value="">Select Size</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-500">201-500 employees</option>
                        <option value="501-1000">501-1000 employees</option>
                        <option value="1000+">1000+ employees</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Admin Details */}
              {step === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm text-indigo-800">
                        This will be the primary admin account with full access to manage your organization.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adminName"
                      value={form.adminName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="adminEmail"
                      value={form.adminEmail}
                      onChange={handleChange}
                      placeholder="admin@company.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Min. 8 characters with 1 number & 1 special character</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {step === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-semibold text-gray-800">Review Your Information</h3>
                  
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Company</p>
                        <p className="font-medium text-gray-800">{form.companyName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Industry</p>
                        <p className="font-medium text-gray-800 capitalize">{form.industry || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Company Size</p>
                        <p className="font-medium text-gray-800">{form.companySize || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Company Email</p>
                        <p className="font-medium text-gray-800">{form.email || '—'}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Admin Name</p>
                          <p className="font-medium text-gray-800">{form.adminName || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider">Admin Email</p>
                          <p className="font-medium text-gray-800">{form.adminEmail || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={form.agreeTerms}
                      onChange={handleChange}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      required
                    />
                    <label className="ml-2 text-sm text-gray-600">
                      I agree to the <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-between">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                  >
                    Back
                  </button>
                )}
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="ml-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!form.agreeTerms}
                    className="ml-auto px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-700 hover:to-purple-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Organization
                  </button>
                )}
              </div>

              {/* Login Link */}
              <p className="mt-6 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/admin-login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>256-bit SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
