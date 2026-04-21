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
      title: "Coordinate-based attendance with real-time visibility",
      shortTitle: "Attendance",
      desc: "Teams can mark attendance from the right place at the right time, while HR gets a clear live view of who is checked in, who is late, and where follow-up is needed.",
      note: "Fast, accurate, and easy to audit.",
      marker: "02",
      accent: "#8B5CF6",
      accentLight: "#F5F3FF",
      stat: "Fewer attendance disputes",
    },
    {
      title: "Task workflows that keep everyone aligned",
      shortTitle: "Task Management",
      desc: "Assign work, track progress, and close the loop without chasing updates across chats and spreadsheets. Managers see momentum, employees see priorities, and teams move faster.",
      note: "Built for everyday execution.",
      marker: "03",
      accent: "#F59E0B",
      accentLight: "#FFFBEB",
      stat: "Clear ownership on every task",
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

  const integrations = ["Slack", "Google Workspace", "Zoom", "Salesforce", "Calendar", "Email", "Teams", "Payroll Systems"];

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
            { number: "500k+", label: "attendance records processed" },
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
          <span>SOC 2 Type II</span>
          <span>GDPR compliant</span>
          <span>99.9% uptime SLA</span>
          <span>Audit-ready activity logs</span>
          <span>Cancel anytime</span>
        </div>

      </div>
    </div>
  );
}
