import { Link } from "react-router-dom";

export default function Pricing() {
  const plans = [
    { 
      name: "Starter", 
      price: "Free", 
      description: "Perfect for small teams just getting started.",
      features: ["Up to 10 employees", "Basic HR tools", "Email support"],
      buttonText: "Get Started",
      buttonLink: "/register-org",
      comingSoon: false
    },
    { 
      name: "Professional", 
      price: "$29/mo", 
      description: "For growing teams that need more automation.",
      features: ["Up to 100 employees", "Payroll & attendance", "Priority support"],
      buttonText: "Coming Soon",
      buttonLink: "#",
      comingSoon: true
    },
    { 
      name: "Enterprise", 
      price: "Custom", 
      description: "Tailored solutions for large organizations.",
      features: ["Unlimited employees", "AI analytics", "Dedicated manager"],
      buttonText: "Coming Soon",
      buttonLink: "#",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-24 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-gray-600 mb-16">
          Start free, upgrade when you need more.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`bg-white p-10 rounded-2xl shadow-sm border border-gray-100 ${
                index === 1 ? 'md:scale-105 border-indigo-200 shadow-lg relative' : ''
              }`}
            >
              {index === 1 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold px-4 py-1 rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h2>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                {plan.price}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {plan.description}
              </p>
              
              <ul className="text-gray-600 space-y-3 mb-8 text-left">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-indigo-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.comingSoon ? (
                <button
                  disabled
                  className="w-full px-6 py-3 bg-gray-100 text-gray-400 font-semibold rounded-xl cursor-not-allowed border border-gray-200"
                >
                  {plan.buttonText}
                </button>
              ) : (
                <Link
                  to={plan.buttonLink}
                  className="block w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
                >
                  {plan.buttonText}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-gray-500">
          All plans include a 30-day free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}