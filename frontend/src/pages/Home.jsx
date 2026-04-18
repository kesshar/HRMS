import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg py-4' : 'bg-transparent py-6'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg"></div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ZENITH HR
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-8">
  <Link 
    to="/features" 
    className="text-gray-600 hover:text-gray-900 text-sm font-medium transition"
  >
    Features
  </Link>

    <Link 
      to="/solutions" 
      className="text-gray-600 hover:text-gray-900 text-sm font-medium transition"
    >
      Solutions
    </Link>

    <Link 
      to="/pricing" 
      className="text-gray-600 hover:text-gray-900 text-sm font-medium transition"
    >
      Pricing
    </Link>

    <Link 
      to="/resources" 
      className="text-gray-600 hover:text-gray-900 text-sm font-medium transition"
    >
      Resources
    </Link>
    </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin-login"
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Sign in
              </Link>

              <Link
                to="/register-org"
                className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Abstract Background */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-full text-sm font-medium text-indigo-700 mb-8">
                <span className="w-2 h-2 bg-indigo-600 rounded-full mr-2"></span>
                Trusted by 5000+ companies
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Where HR Meets{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Intelligence
                </span>
              </h1>
              
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Transform your HR operations with AI-powered insights, automated workflows, and data-driven decision making. Built for modern teams.
              </p>

              {/* <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register-org"
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 text-center"
                >
                  Start 14-day free trial
                </Link> */}
                
                {/* /* <button className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Watch Demo
                </button> */}
              {/* </div> */}

              <div className="mt-10 flex flex-col sm:flex-row gap-4">
  <Link
    to="/register-org"
    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-indigo-700 hover:to-purple-700 transform hover:-translate-y-0.5 transition-all duration-200 text-center"
  >
    Start 14-day free trial
  </Link>

  {/*
  <button className="px-8 py-4 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2">
    ...
  </button>
  */}
</div>

              <div className="mt-10 flex items-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  24/7 Support
                </div>
              </div>
            </div>

            {/* Right Column - Dashboard Preview */}
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="ml-2 text-sm text-gray-400">Dashboard Preview</span>
                </div>
                
                {/* Mock Dashboard Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Total Employees</div>
                    <div className="text-2xl font-bold text-gray-900">247</div>
                    <div className="text-xs text-green-600 mt-2">↑ 12% this month</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Active Tasks</div>
                    <div className="text-2xl font-bold text-gray-900">1,432</div>
                    <div className="text-xs text-green-600 mt-2">87% completed</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Attendance</div>
                    <div className="text-2xl font-bold text-gray-900">96%</div>
                    <div className="text-xs text-green-600 mt-2">↑ 3% vs last week</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl">
                    <div className="text-xs text-gray-500 mb-1">Open Positions</div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                    <div className="text-xs text-amber-600 mt-2">4 urgent</div>
                  </div>
                </div>

                {/* Chart Mockup */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">Employee Growth</span>
                    <span className="text-xs text-gray-500">Last 6 months</span>
                  </div>
                  <div className="flex items-end gap-2 h-24">
                    <div className="flex-1 bg-indigo-100 rounded-t-lg h-16 hover:bg-indigo-200 transition"></div>
                    <div className="flex-1 bg-indigo-200 rounded-t-lg h-20 hover:bg-indigo-300 transition"></div>
                    <div className="flex-1 bg-indigo-300 rounded-t-lg h-24 hover:bg-indigo-400 transition"></div>
                    <div className="flex-1 bg-indigo-400 rounded-t-lg h-20 hover:bg-indigo-500 transition"></div>
                    <div className="flex-1 bg-indigo-500 rounded-t-lg h-28 hover:bg-indigo-600 transition"></div>
                    <div className="flex-1 bg-indigo-600 rounded-t-lg h-32 hover:bg-indigo-700 transition"></div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-600 rounded-full opacity-10 blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-600 rounded-full opacity-10 blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Companies */}
      <div className="bg-gray-50 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm font-medium text-gray-500 uppercase tracking-wider mb-8">
            Trusted by innovative companies worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center opacity-50">
            <div className="text-gray-400 font-bold text-xl">COMPANY</div>
            <div className="text-gray-400 font-bold text-xl">ENTERPRISE</div>
            <div className="text-gray-400 font-bold text-xl">STARTUP</div>
            <div className="text-gray-400 font-bold text-xl">TECH CORP</div>
            <div className="text-gray-400 font-bold text-xl">INNOVATE</div>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}