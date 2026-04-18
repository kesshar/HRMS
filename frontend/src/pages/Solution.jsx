export default function Solutions() {
  const solutions = [
    {
      label: "For Startups",
      heading: "Built for speed, not scale you don't have yet.",
      description:
        "Most HR tools are designed for 500-person companies and then sold to 12-person ones. Ours isn't. You get what you need now — onboarding, payroll, basic compliance — and it grows with you without a painful migration later.",
      callout: "Used by 600+ early-stage teams",
      points: ["Setup in under a day", "No per-module pricing", "Founders actually use it"],
      accent: "#2563EB",
      accentLight: "#EFF6FF",
      marker: "01",
    },
    {
      label: "For SMBs",
      heading: "Stop chasing timesheets. Seriously.",
      description:
        "You're running a real business, not a spreadsheet. We handle the repetitive stuff — payroll runs, PTO tracking, compliance reminders — so your ops team isn't doing manual data entry on a Friday afternoon.",
      callout: "Average 6hrs/week saved per HR admin",
      points: ["Automated payroll runs", "Integrated time tracking", "One source of truth"],
      accent: "#059669",
      accentLight: "#ECFDF5",
      marker: "02",
    },
    {
      label: "For Enterprise",
      heading: "Control at scale, without the IT headache.",
      description:
        "Multiple departments, multiple regions, multiple compliance requirements. We give your HR leads full visibility and your IT team the security guarantees they'll actually sign off on — SSO, audit logs, custom roles.",
      callout: "SOC 2 Type II certified",
      points: ["Custom workflows per department", "SAML/SSO + granular permissions", "Dedicated implementation support"],
      accent: "#7C3AED",
      accentLight: "#F5F3FF",
      marker: "03",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[#fafaf9] py-24 px-6"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p
            className="text-xs uppercase tracking-widest text-gray-400 mb-5"
            style={{ fontFamily: "monospace" }}
          >
            Who it's for
          </p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
            The right tool<br />
            <span className="text-gray-400 font-normal italic">for where you actually are.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            We don't believe in one-size-fits-all HR software. 
            A 10-person startup and a 2,000-person company have genuinely different problems.
            Here's how we've thought about each.
          </p>
        </div>

        {/* Solutions — vertical stacked layout */}
        <div className="space-y-6">
          {solutions.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors duration-200 shadow-sm"
            >
              <div className="flex flex-col md:flex-row">

                {/* Left accent bar + number */}
                <div
                  className="md:w-2 w-full h-2 md:h-auto flex-shrink-0"
                  style={{ backgroundColor: s.accent }}
                />

                {/* Main content */}
                <div className="flex-1 p-8 md:p-10">
                  <div className="flex flex-col md:flex-row md:gap-12">

                    {/* Left column */}
                    <div className="flex-1 mb-8 md:mb-0">
                      <div className="flex items-center gap-3 mb-4">
                        <span
                          className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: s.accentLight,
                            color: s.accent,
                            fontFamily: "monospace",
                          }}
                        >
                          {s.label}
                        </span>
                        <span
                          className="text-xs text-gray-300 font-light"
                          style={{ fontFamily: "monospace" }}
                        >
                          {s.marker}
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold text-gray-900 leading-snug mb-4">
                        {s.heading}
                      </h2>

                      <p className="text-gray-500 leading-relaxed text-[0.97rem]">
                        {s.description}
                      </p>

                      <div
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ color: s.accent, fontFamily: "'Georgia', serif" }}
                      >
                        See how it works →
                      </div>
                    </div>

                    {/* Right column — feature points */}
                    <div className="md:w-64 flex-shrink-0">
                      <div
                        className="rounded-xl p-5"
                        style={{ backgroundColor: s.accentLight }}
                      >
                        <p
                          className="text-xs uppercase tracking-widest mb-4 font-semibold"
                          style={{ color: s.accent, fontFamily: "monospace" }}
                        >
                          What you get
                        </p>
                        <ul className="space-y-3">
                          {s.points.map((point, j) => (
                            <li
                              key={j}
                              className="flex items-start gap-2.5 text-sm text-gray-700 leading-snug"
                            >
                              <span
                                className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold"
                                style={{ backgroundColor: s.accent }}
                              >
                                ✓
                              </span>
                              {point}
                            </li>
                          ))}
                        </ul>

                        <div
                          className="mt-5 pt-4 border-t text-xs text-gray-400 leading-snug"
                          style={{ borderColor: `${s.accent}22`, fontFamily: "monospace" }}
                        >
                          {s.callout}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom section — honest CTA */}
        <div className="mt-16 border-t border-gray-200 pt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-gray-900 font-bold text-lg mb-1" style={{ fontFamily: "'Georgia', serif" }}>
              Not sure which fits?
            </p>
            <p className="text-gray-500 text-sm">
              Tell us a bit about your team and we'll be honest about whether we're the right fit.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
