// // import { Link } from "react-router-dom";

// // export default function Features() {
// //   const features = [
// //     {
// //       title: "AI-Powered Analytics",
// //       desc: "Gain deep insights into employee performance, engagement, and productivity using intelligent data models.",
// //       emoji: "📊"
// //     },
// //     {
// //       title: "Automated Payroll",
// //       desc: "Seamlessly manage payroll, tax compliance, and salary disbursement with full automation.",
// //       emoji: "💰"
// //     },
// //     {
// //       title: "Smart Attendance",
// //       desc: "Track attendance with real-time dashboards and advanced reporting.",
// //       emoji: "⏰"
// //     },
// //     {
// //       title: "Recruitment Management",
// //       desc: "Post jobs, track candidates, and streamline hiring workflows effortlessly.",
// //       emoji: "👥"
// //     },
// //     {
// //       title: "Role-Based Access",
// //       desc: "Secure access control for Admins, HR, and Employees.",
// //       emoji: "🔒"
// //     },
// //     {
// //       title: "Organization Management",
// //       desc: "Manage multiple departments and teams under one unified dashboard.",
// //       emoji: "🏢"
// //     }
// //   ];

// //   // Simple color array for variety
// //   const colors = [
// //     "from-blue-500 to-blue-600",
// //     "from-green-500 to-green-600",
// //     "from-purple-500 to-purple-600",
// //     "from-orange-500 to-orange-600",
// //     "from-red-500 to-red-600",
// //     "from-indigo-500 to-indigo-600"
// //   ];

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <div className="max-w-7xl mx-auto px-6 py-24">
// //         {/* Header */}
// //         <div className="text-center max-w-3xl mx-auto">
// //           <h1 className="text-4xl font-bold text-gray-900 mb-4">
// //             Powerful Features for Modern HR
// //           </h1>
// //           <p className="text-lg text-gray-600">
// //             Everything you need to manage your workforce efficiently.
// //           </p>
// //         </div>

// //         {/* Features grid */}
// //         <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
// //           {features.map((feature, index) => (
// //             <div 
// //               key={index} 
// //               className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
// //             >
// //               <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${colors[index]} flex items-center justify-center mb-6 text-2xl`}>
// //                 {feature.emoji}
// //               </div>
// //               <h3 className="text-xl font-semibold text-gray-900 mb-3">
// //                 {feature.title}
// //               </h3>
// //               <p className="text-gray-600 leading-relaxed">
// //                 {feature.desc}
// //               </p>
// //             </div>
// //           ))}
// //         </div>

// //         {/* CTA */}
// //         <div className="mt-16 text-center">
// //           <Link
// //             to="/register-org"
// //             className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
// //           >
// //             Get Started Free
// //           </Link>
// //           <p className="mt-4 text-sm text-gray-500">
// //             No credit card required • Free 14-day trial
// //           </p>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// import { Link } from "react-router-dom";

// export default function Features() {
//   const features = [
//     {
//       title: "AI-Powered Analytics",
//       desc: "Transform workforce data into actionable insights. Our machine learning models identify patterns in performance, engagement, and productivity that human analysis might miss.",
//       emoji: "📊",
//       metric: "35% faster insights"
//     },
//     {
//       title: "Automated Payroll",
//       desc: "Run payroll in minutes, not hours. Handle tax calculations, compliance updates, and salary disbursements across multiple jurisdictions automatically.",
//       emoji: "💰",
//       metric: "80% time saved"
//     },
//     {
//       title: "Smart Attendance",
//       desc: "Real-time tracking with biometric verification and geofencing. Integrated with scheduling to prevent overtime surprises before they happen.",
//       emoji: "⏰",
//       metric: "99.9% accuracy"
//     },
//     {
//       title: "Recruitment Management",
//       desc: "Source, track, and evaluate candidates in one place. Collaborative hiring tools that keep your team aligned and candidates engaged.",
//       emoji: "👥",
//       metric: "50% faster hiring"
//     },
//     {
//       title: "Role-Based Access",
//       desc: "Granular permissions that scale with your organization. SOC2-compliant security with audit logs and customizable approval workflows.",
//       emoji: "🔒",
//       metric: "Enterprise-grade"
//     },
//     {
//       title: "Organization Management",
//       desc: "Visual org charts, department hierarchies, and team structures that update automatically as your company grows and evolves.",
//       emoji: "🏢",
//       metric: "Real-time updates"
//     }
//   ];

//   return (
//     <div className="bg-white">
//       {/* Hero section */}
//       <div className="border-b border-gray-100">
//         <div className="max-w-7xl mx-auto px-6 py-20">
//           <div className="text-center max-w-3xl mx-auto">
//             <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-6">
//               Enterprise-grade HR tools
//               <span className="text-indigo-600"> without the complexity</span>
//             </h1>
//             <p className="text-xl text-gray-600 mb-8">
//               Everything from payroll to performance — designed for companies that take their people seriously.
//             </p>
//             <div className="flex items-center justify-center gap-4">
//               <Link
//                 to="/register-org"
//                 className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
//               >
//                 Start 14-day free trial
//               </Link>
//               <Link
//                 to="/demo"
//                 className="px-8 py-4 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
//               >
//                 Schedule a demo
//               </Link>
//             </div>
//             <p className="mt-4 text-sm text-gray-400">
//               No credit card required • Cancel anytime
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Stats bar */}
//       <div className="border-b border-gray-100 bg-gray-50/50">
//         <div className="max-w-7xl mx-auto px-6 py-12">
//           <div className="grid grid-cols-3 gap-8">
//             <div className="text-center">
//               <div className="text-3xl font-bold text-gray-900">10k+</div>
//               <div className="text-sm text-gray-500 mt-1">companies trust us</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-gray-900">$2B+</div>
//               <div className="text-sm text-gray-500 mt-1">payroll processed</div>
//             </div>
//             <div className="text-center">
//               <div className="text-3xl font-bold text-gray-900">99.9%</div>
//               <div className="text-sm text-gray-500 mt-1">uptime SLA</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Features section */}
//       <div className="max-w-7xl mx-auto px-6 py-24">
//         <div className="text-center max-w-3xl mx-auto mb-16">
//           <h2 className="text-3xl font-bold text-gray-900 mb-4">
//             Built for how HR actually works
//           </h2>
//           <p className="text-lg text-gray-600">
//             Not just another HRIS. Real tools that solve real problems — from onboarding to offboarding.
//           </p>
//         </div>

//         {/* Features grid */}
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {features.map((feature, index) => (
//             <div 
//               key={index} 
//               className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-indigo-200 hover:shadow-lg transition-all"
//             >
//               {/* Top accent */}
//               <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              
//               {/* Icon */}
//               <div className="text-3xl mb-6 bg-gray-50 w-14 h-14 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
//                 {feature.emoji}
//               </div>
              
//               {/* Content */}
//               <h3 className="text-xl font-semibold text-gray-900 mb-3">
//                 {feature.title}
//               </h3>
//               <p className="text-gray-600 leading-relaxed mb-4">
//                 {feature.desc}
//               </p>
              
//               {/* Metric */}
//               <div className="inline-flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
//                 {feature.metric}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Integrations section */}
//         <div className="mt-24 text-center">
//           <h3 className="text-lg font-semibold text-gray-900 mb-6">
//             Seamlessly integrates with your stack
//           </h3>
//           <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 text-gray-400">
//             <span className="text-xl font-medium">Slack</span>
//             <span className="text-xl font-medium">QuickBooks</span>
//             <span className="text-xl font-medium">G Suite</span>
//             <span className="text-xl font-medium">Zoom</span>
//             <span className="text-xl font-medium">Salesforce</span>
//             <span className="text-xl font-medium">+ 50 more</span>
//           </div>
//         </div>

//         {/* Trust badges */}
//         <div className="mt-24 pt-12 border-t border-gray-100">
//           <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
//             <span className="flex items-center gap-2">🔒 SOC2 Type II</span>
//             <span className="flex items-center gap-2">🌍 GDPR Compliant</span>
//             <span className="flex items-center gap-2">⚡ 99.9% Uptime</span>
//             <span className="flex items-center gap-2">🛡️ Bank-level encryption</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// import { Link } from "react-router-dom";

// export default function Features() {
//   const features = [
//     {
//       title: "Analytics that actually tell you something",
//       shortTitle: "Analytics",
//       desc: "We got tired of dashboards full of numbers that didn't help anyone make a decision. Ours surfaces what matters — who's disengaged before they quit, where bottlenecks are forming, what's actually driving performance.",
//       note: "Not just charts. Answers.",
//       marker: "01",
//       accent: "#2563EB",
//       accentLight: "#EFF6FF",
//       stat: "35% faster decisions",
//     },
//     {
//       title: "Payroll that runs without you babysitting it",
//       shortTitle: "Payroll",
//       desc: "Multi-jurisdiction tax handling, automatic compliance updates, direct deposit. You set it up once and it runs. If something needs your attention, it tells you — instead of silently getting it wrong.",
//       note: "SOC 2 audited. GDPR compliant.",
//       marker: "02",
//       accent: "#059669",
//       accentLight: "#ECFDF5",
//       stat: "80% less manual work",
//     },
//     {
//       title: "Attendance tracking people don't try to game",
//       shortTitle: "Attendance",
//       desc: "Geofencing, biometric, or good old manual — whatever fits your team. The real win is the scheduling integration: you see overtime risk before it happens, not after the payroll run.",
//       note: "Works for remote, hybrid, and on-site.",
//       marker: "03",
//       accent: "#D97706",
//       accentLight: "#FFFBEB",
//       stat: "99.9% accuracy rate",
//     },
//     {
//       title: "Hiring without the spreadsheet chaos",
//       shortTitle: "Recruitment",
//       desc: "One place for job posts, applications, scorecards, and offer letters. Your hiring team stays in sync, candidates don't fall through the cracks, and you can see where every pipeline is at a glance.",
//       note: "Integrates with LinkedIn, Indeed, and more.",
//       marker: "04",
//       accent: "#7C3AED",
//       accentLight: "#F5F3FF",
//       stat: "50% faster time-to-hire",
//     },
//     {
//       title: "Permissions that make sense to non-IT people",
//       shortTitle: "Access Control",
//       desc: "Role-based access that you can actually configure without a 40-page manual. Employees see what they need, managers see their teams, HR sees everything — with a full audit trail of who touched what.",
//       note: "Enterprise-grade, startup-friendly setup.",
//       marker: "05",
//       accent: "#DC2626",
//       accentLight: "#FEF2F2",
//       stat: "Zero data leaks on our watch",
//     },
//     {
//       title: "Org charts that keep up with your company",
//       shortTitle: "Org Management",
//       desc: "Teams change fast. People move around, departments split, new managers get promoted. Your org chart should reflect that in real time, not whenever someone remembers to update a PowerPoint slide.",
//       note: "Updates automatically as you make changes.",
//       marker: "06",
//       accent: "#0891B2",
//       accentLight: "#ECFEFF",
//       stat: "Real-time, always accurate",
//     },
//   ];

//   const integrations = ["Slack", "QuickBooks", "Google Workspace", "Zoom", "Salesforce", "Xero", "Rippling", "Greenhouse"];

//   return (
//     <div
//       className="bg-[#fafaf9] min-h-screen"
//       style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
//     >
//       <div className="max-w-5xl mx-auto px-6 py-20">

//         {/* Header */}
//         <div className="max-w-2xl mb-6">
//           <p className="text-xs uppercase tracking-widest text-gray-400 mb-5" style={{ fontFamily: "monospace" }}>
//             What's inside
//           </p>
//           <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
//             Tools that do the job,<br />
//             <span className="text-gray-400 font-normal italic">without the noise.</span>
//           </h1>
//           <p className="text-gray-500 text-lg leading-relaxed">
//             We built these features by watching HR teams work — the messy, real-world version, 
//             not the demo version. Here's what we ended up with.
//           </p>
//         </div>

//         {/* Stats — understated */}
//         <div
//           className="flex flex-wrap gap-8 mb-20 pt-8 border-t border-dashed border-gray-300"
//         >
//           {[
//             { number: "10,000+", label: "companies using this" },
//             { number: "$2B+", label: "payroll processed" },
//             { number: "99.9%", label: "uptime, last 12 months" },
//           ].map(({ number, label }) => (
//             <div key={label}>
//               <div className="text-3xl font-bold text-gray-900">{number}</div>
//               <div className="text-sm text-gray-400 mt-0.5" style={{ fontFamily: "monospace" }}>
//                 {label}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Features — two-column editorial grid */}
//         <div className="grid md:grid-cols-2 gap-6">
//           {features.map((f, i) => (
//             <div
//               key={i}
//               className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors duration-200 shadow-sm"
//             >
//               {/* Top accent bar */}
//               <div className="h-1 w-full" style={{ backgroundColor: f.accent }} />

//               <div className="p-7">
//                 {/* Header row */}
//                 <div className="flex items-center justify-between mb-4">
//                   <span
//                     className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
//                     style={{
//                       backgroundColor: f.accentLight,
//                       color: f.accent,
//                       fontFamily: "monospace",
//                     }}
//                   >
//                     {f.shortTitle}
//                   </span>
//                   <span
//                     className="text-xs text-gray-300"
//                     style={{ fontFamily: "monospace" }}
//                   >
//                     {f.marker}
//                   </span>
//                 </div>

//                 {/* Title */}
//                 <h2 className="text-xl font-bold text-gray-900 leading-snug mb-3">
//                   {f.title}
//                 </h2>

//                 {/* Description */}
//                 <p className="text-gray-500 text-sm leading-relaxed mb-5">
//                   {f.desc}
//                 </p>

//                 {/* Footer row */}
//                 <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
//                   <p
//                     className="text-xs text-gray-400 italic"
//                     style={{ fontFamily: "'Georgia', serif" }}
//                   >
//                     {f.note}
//                   </p>
//                   <span
//                     className="text-xs font-bold"
//                     style={{ color: f.accent, fontFamily: "monospace" }}
//                   >
//                     {f.stat}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Integrations — low-key */}
//         <div className="mt-20 pt-12 border-t border-gray-200">
//           <p
//             className="text-xs uppercase tracking-widest text-gray-400 mb-6"
//             style={{ fontFamily: "monospace" }}
//           >
//             Plays well with
//           </p>
//           <div className="flex flex-wrap gap-3">
//             {integrations.map((name) => (
//               <span
//                 key={name}
//                 className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm"
//               >
//                 {name}
//               </span>
//             ))}
//             <span
//               className="px-4 py-2 bg-white border border-dashed border-gray-300 rounded-full text-sm text-gray-400"
//             >
//               + 50 more
//             </span>
//           </div>
//         </div>

//         {/* CTA — honest, not hype */}
//         <div className="mt-20 bg-white border border-gray-200 rounded-2xl p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
//           <div>
//             <h3
//               className="text-2xl font-bold text-gray-900 mb-2"
//               style={{ fontFamily: "'Georgia', serif" }}
//             >
//               Try it with your actual data.
//             </h3>
//             <p className="text-gray-500 text-sm leading-relaxed max-w-md">
//               14 days, no credit card. If it doesn't fit your team by the end of it, we'll even help you export your data out cleanly. No hard feelings.
//             </p>
//           </div>
//           <div className="flex flex-col gap-3 flex-shrink-0">
//             <Link
//               to="/register-org"
//               className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-center"
//             >
//               Start free trial
//             </Link>
//             <Link
//               to="/demo"
//               className="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:border-gray-400 transition-colors text-center"
//             >
//               Book a demo
//             </Link>
//           </div>
//         </div>

//         {/* Trust — minimal */}
//         <div
//           className="mt-12 flex flex-wrap gap-6 text-xs text-gray-400"
//           style={{ fontFamily: "monospace" }}
//         >
//           <span>✓ SOC 2 Type II</span>
//           <span>✓ GDPR compliant</span>
//           <span>✓ 99.9% uptime SLA</span>
//           <span>✓ Bank-level encryption</span>
//           <span>✓ Cancel anytime</span>
//         </div>

//       </div>
//     </div>
//   );
// }

import { Link } from "react-router-dom";

export default function Features() {
  const features = [
    {
      title: "Analytics that actually tell you something",
      shortTitle: "Analytics",
      desc: "We got tired of dashboards full of numbers that didn't help anyone make a decision. Ours surfaces what matters — who's disengaged before they quit, where bottlenecks are forming, what's actually driving performance.",
      note: "Not just charts. Answers.",
      marker: "01",
      accent: "#2563EB",
      accentLight: "#EFF6FF",
      stat: "35% faster decisions",
    },
    {
      title: "Task-based rewards with Sepolia points",
      shortTitle: "Blockchain Rewards",
      desc: "Complete tasks, earn Sepolia points directly in your wallet. Every achievement is verified on-chain — transparent, fair, and instant. No more waiting for monthly payouts or manual approvals.",
      note: "Powered by smart contracts",
      marker: "02",
      accent: "#8B5CF6",
      accentLight: "#F5F3FF",
      stat: "Instant payouts",
    },
    {
      title: "MetaMask wallet integration",
      shortTitle: "Wallet Connect",
      desc: "Seamless connection with MetaMask. Employees see their earnings in real-time, track their balance, and receive points the moment a task is marked complete. No complex blockchain knowledge required.",
      note: "Works with any EVM wallet",
      marker: "03",
      accent: "#F59E0B",
      accentLight: "#FFFBEB",
      stat: "Real-time balance updates",
    },
    {
      title: "Hiring without the spreadsheet chaos",
      shortTitle: "Recruitment",
      desc: "One place for job posts, applications, scorecards, and offer letters. Your hiring team stays in sync, candidates don't fall through the cracks, and you can see where every pipeline is at a glance.",
      note: "Integrates with LinkedIn, Indeed, and more.",
      marker: "04",
      accent: "#7C3AED",
      accentLight: "#F5F3FF",
      stat: "50% faster time-to-hire",
    },
    {
      title: "Permissions that make sense to non-IT people",
      shortTitle: "Access Control",
      desc: "Role-based access that you can actually configure without a 40-page manual. Employees see what they need, managers see their teams, HR sees everything — with a full audit trail of who touched what.",
      note: "Enterprise-grade, startup-friendly setup.",
      marker: "05",
      accent: "#DC2626",
      accentLight: "#FEF2F2",
      stat: "Zero data leaks on our watch",
    },
    {
      title: "Org charts that keep up with your company",
      shortTitle: "Org Management",
      desc: "Teams change fast. People move around, departments split, new managers get promoted. Your org chart should reflect that in real time, not whenever someone remembers to update a PowerPoint slide.",
      note: "Updates automatically as you make changes.",
      marker: "06",
      accent: "#0891B2",
      accentLight: "#ECFEFF",
      stat: "Real-time, always accurate",
    },
  ];

  const integrations = ["MetaMask", "Coinbase Wallet", "WalletConnect", "Sepolia Testnet", "Slack", "Google Workspace", "Zoom", "Salesforce"];

  return (
    <div
      className="bg-[#fafaf9] min-h-screen"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="max-w-2xl mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-5" style={{ fontFamily: "monospace" }}>
            What's inside
          </p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
            Tools that do the job,<br />
            <span className="text-gray-400 font-normal italic">without the noise.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            We built these features by watching HR teams work — the messy, real-world version, 
            not the demo version. Here's what we ended up with.
          </p>
        </div>

        {/* Stats — understated */}
        <div
          className="flex flex-wrap gap-8 mb-20 pt-8 border-t border-dashed border-gray-300"
        >
          {[
            { number: "10,000+", label: "companies using this" },
            { number: "500k+", label: "Sepolia points distributed" },
            { number: "99.9%", label: "uptime, last 12 months" },
          ].map(({ number, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-gray-900">{number}</div>
              <div className="text-sm text-gray-400 mt-0.5" style={{ fontFamily: "monospace" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Features — two-column editorial grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors duration-200 shadow-sm"
            >
              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ backgroundColor: f.accent }} />

              <div className="p-7">
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: f.accentLight,
                      color: f.accent,
                      fontFamily: "monospace",
                    }}
                  >
                    {f.shortTitle}
                  </span>
                  <span
                    className="text-xs text-gray-300"
                    style={{ fontFamily: "monospace" }}
                  >
                    {f.marker}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 leading-snug mb-3">
                  {f.title}
                </h2>

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {f.desc}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                  <p
                    className="text-xs text-gray-400 italic"
                    style={{ fontFamily: "'Georgia', serif" }}
                  >
                    {f.note}
                  </p>
                  <span
                    className="text-xs font-bold"
                    style={{ color: f.accent, fontFamily: "monospace" }}
                  >
                    {f.stat}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integrations — low-key */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <p
            className="text-xs uppercase tracking-widest text-gray-400 mb-6"
            style={{ fontFamily: "monospace" }}
          >
            Plays well with
          </p>
          <div className="flex flex-wrap gap-3">
            {integrations.map((name) => (
              <span
                key={name}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm"
              >
                {name}
              </span>
            ))}
            <span
              className="px-4 py-2 bg-white border border-dashed border-gray-300 rounded-full text-sm text-gray-400"
            >
              + 50 more
            </span>
          </div>
        </div>

        {/* CTA — honest, not hype */}
        <div className="mt-20 bg-white border border-gray-200 rounded-2xl p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h3
              className="text-2xl font-bold text-gray-900 mb-2"
              style={{ fontFamily: "'Georgia', serif" }}
            >
              Try it with your actual data.
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md">
              14 days, no credit card. If it doesn't fit your team by the end of it, we'll even help you export your data out cleanly. No hard feelings.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <Link
              to="/register-org"
              className="px-6 py-3 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Start free trial
            </Link>
          </div>
        </div>

        {/* Trust — minimal */}
        <div
          className="mt-12 flex flex-wrap gap-6 text-xs text-gray-400"
          style={{ fontFamily: "monospace" }}
        >
          <span>✓ SOC 2 Type II</span>
          <span>✓ GDPR compliant</span>
          <span>✓ 99.9% uptime SLA</span>
          <span>✓ On-chain verified</span>
          <span>✓ Cancel anytime</span>
        </div>

      </div>
    </div>
  );
}