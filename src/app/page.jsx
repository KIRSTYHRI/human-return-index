export default function HomePage() {
  return (
    <main
      style={{
        padding: 24,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "system-ui",
      }}
    >
      {/* HERO */}
      <section style={{ marginBottom: 32 }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: 0.7,
            marginBottom: 8,
          }}
        >
          People-first KPI for modern organisations
        </p>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 12,
          }}
        >
          Human Return Index™
        </h1>

        <p
          style={{
            fontSize: 16,
            opacity: 0.85,
            marginBottom: 20,
            maxWidth: 620,
          }}
        >
          Turn wellbeing, culture and leadership into one clear score your board
          actually understands – and a live dashboard that shows exactly where
          to act next.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.4rem",
              borderRadius: 999,
              backgroundColor: "#fee000",
              color: "#000",
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            View live HRI dashboard
          </a>

          <a
            href="mailto:hello@humanreturnindex.com?subject=HRI%20Pilot%20Enquiry"
            style={{
              display: "inline-block",
              padding: "0.75rem 1.4rem",
              borderRadius: 999,
              border: "1px solid #111",
              color: "#111",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Book a pilot walkthrough
          </a>
        </div>

        <p style={{ fontSize: 12, opacity: 0.65 }}>
          This is our live pilot environment. In production, each organisation
          will only ever see their own data.
        </p>
      </section>

      {/* WHAT HRI SHOWS */}
      <section style={{ marginBottom: 28 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          What Human Return Index™ actually shows you
        </h2>
        <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 12 }}>
          Human Return Index™ combines internal assessments, employee pulse
          surveys and hard business metrics to show:
        </p>

        <ul
          style={{
            fontSize: 14,
            opacity: 0.9,
            paddingLeft: 18,
            marginBottom: 8,
          }}
        >
          <li>where people are thriving vs at risk across five core pillars</li>
          <li>what that means in real £ cost (turnover and absence)</li>
          <li>
            the gap between what you spend on people and what you&apos;re
            actually getting back
          </li>
        </ul>
      </section>

      {/* VALUE BLOCKS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <ValueCard
          title="One score everyone understands"
          body="No more guessing. One HRI score out of 100 that wraps culture, wellbeing and leadership into a language the C-suite and board can act on."
        />
        <ValueCard
          title="From symptoms to signals"
          body="See exactly which pillars are dragging performance – leadership, trust, inclusion, growth or mental health – and where to focus next."
        />
        <ValueCard
          title="Built for ROI conversations"
          body="Model the £ cost of turnover and absence against your current wellbeing and people investment, so you can prove impact instead of justifying spend."
        />
      </section>

      {/* PILOT EXPLAINER */}
      <section
        style={{
          borderRadius: 12,
          border: "1px solid #eee",
          padding: 16,
          background: "#fafafa",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          How the pilot works
        </h2>
        <p style={{ fontSize: 14, opacity: 0.85, marginBottom: 8 }}>
          This environment is wired to a real database (Supabase) and a live
          scoring engine. For pilots we typically:
        </p>
        <ul
          style={{
            fontSize: 14,
            opacity: 0.9,
            paddingLeft: 18,
            marginBottom: 8,
          }}
        >
          <li>pre-load your organisation profile and key people metrics</li>
          <li>run an initial HRI assessment with your leadership team</li>
          <li>
            launch a short employee pulse to compare lived experience vs
            internal view
          </li>
        </ul>
        <p style={{ fontSize: 14, opacity: 0.9 }}>
          The result: your first view of HRI is built on your reality – not
          generic demo data.
        </p>
        <p style={{ fontSize: 14, marginTop: 10 }}>
          Ready to explore Human Return Index™ in your organisation? Drop a line
          to{" "}
          <a href="mailto:hello@humanreturnindex.com">
            hello@humanreturnindex.com
          </a>{" "}
          and we&apos;ll set up your pilot space.
        </p>
      </section>
    </main>
  );
}

function ValueCard({ title, body }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #eee",
        padding: 14,
        background: "white",
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 13, opacity: 0.85 }}>{body}</p>
    </div>
  );
}
