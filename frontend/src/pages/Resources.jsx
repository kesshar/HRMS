export default function Resources() {
  const resources = [
    {
      marker: "01",
      tag: "AI & Tech",
      accent: "#2563EB",
      accentLight: "#EFF6FF",
      title: "AI in HR — what we actually use and what we turned off",
      subtitle: "we tested 15 tools across 6 months. here's what stuck.",
      desc: "Last year we went all-in on AI tools. Some saved hours, others created more work. This is our internal doc — the ones we kept, the ones we cancelled, and why a chatbot isn't always better than a simple form.",
      meta: "Written by Prashant · Engineering",
      note: "Includes our prompt templates",
    //   cta: "Read the notes →",
    },
    {
      marker: "02",
      tag: "Culture",
      accent: "#059669",
      accentLight: "#ECFDF5",
      title: "The engagement survey we stopped using",
      subtitle: "it told us everyone was happy. people kept leaving.",
      desc: "Our old survey gave us great scores. Meanwhile, quiet exits were up and people weren't recommending us. We scrapped it and spent 3 months building a new one. This is what we ask now.",
      meta: "Written by Prashant · People Ops",
      note: "Took 4 iterations to get right",
    //   cta: "See the questions →",
    },
    {
      marker: "03",
      tag: "Operations",
      accent: "#D97706",
      accentLight: "#FFFBEB",
      title: "Payroll mistakes — the ones we made so you don't have to",
      subtitle: "written at 11pm after a very expensive error",
      desc: "Prashant wrote this after messing up contractor payments two quarters in a row. It's not a compliance guide from some lawyer. It's a list of the exact things that broke, in the order they broke, and how we catch them now.",
      meta: "Written by Prashant · Finance",
      note: "Updated quarterly with new screw-ups",
    //   cta: "Read the post-mortem →",
    },
    {
      marker: "04",
      tag: "Remote Work",
      accent: "#7C3AED",
      accentLight: "#F5F3FF",
      title: "What broke when we went fully remote",
      subtitle: "and the stuff we didn't see coming",
      desc: "We thought we had remote work figured out. Then people started feeling isolated, decisions slowed down, and 'async' became an excuse for never talking. This is what we changed — and what we're still figuring out.",
      meta: "Written by Prashant · Operations",
      note: "Still a work in progress",
    //   cta: "Read the honest version →",
    },
  ];

  return (
    <div
      className="bg-[#fafaf9] min-h-screen"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="mb-14">
          <p
            className="text-xs uppercase tracking-widest text-gray-400 mb-5"
            style={{ fontFamily: "monospace" }}
          >
            Resources
          </p>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-5">
            Guides from people<br />
            <span className="text-gray-400 font-normal italic">who figured it out the hard way.</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            We write these for ourselves — to remember what broke, what worked, and 
            what we'd do differently. Sharing them in case they're useful to you too.
          </p>
        </div>

        {/* Resources list */}
        <div className="space-y-5">
          {resources.map((r) => (
            <div
              key={r.marker}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors duration-200 shadow-sm"
            >
              {/* Top accent bar */}
              <div className="h-1 w-full" style={{ backgroundColor: r.accent }} />

              <div className="p-7">
                {/* Tag row */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: r.accentLight,
                      color: r.accent,
                      fontFamily: "monospace",
                    }}
                  >
                    {r.tag}
                  </span>
                  <span
                    className="text-xs text-gray-300"
                    style={{ fontFamily: "monospace" }}
                  >
                    {r.marker}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-gray-900 leading-snug mb-1">
                  {r.title}
                </h2>
                <p
                  className="text-gray-400 text-sm italic mb-4"
                  style={{ fontFamily: "'Georgia', serif" }}
                >
                  {r.subtitle}
                </p>

                {/* Description */}
                <p className="text-gray-500 text-sm leading-relaxed mb-5">
                  {r.desc}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-100">
                  <div>
                    <p
                      className="text-xs text-gray-400"
                      style={{ fontFamily: "monospace" }}
                    >
                      {r.meta}
                    </p>
                    {r.note && (
                      <p className="text-xs text-gray-400 italic mt-0.5">
                        {r.note}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: r.accent }}
                  >
                    {r.cta}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div
          className="mt-14 pt-8 border-t border-dashed border-gray-200 text-xs text-gray-400"
          style={{ fontFamily: "monospace" }}
        >
          ✍️ all guides written internally · last updated march 2026 · new ones added when we break things
        </div>

      </div>
    </div>
  );
}
