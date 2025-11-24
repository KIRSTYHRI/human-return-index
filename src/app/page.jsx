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
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #eee",
              background: "#fafafa",
            }}
          >
            People-first KPI for modern organisations
          </span>
        </div>

        <h1
          style={{
            fontSize: 34,
            fontWeight: 800,
            marginTop: 12,
            marginBottom: 8,
          }}
        >
          Human Return Index™
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: 16,
            maxWidth: 620,
            opacity: 0.85,
          }}
        >
          Turn wellbeing, culture and leadership into one clear score your board
          actually understands – and a dashboard that shows exactly where to
          act next.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 20,
          }}
        >
          <a
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "0.8rem 1.6rem",
              borderRadius: 999,
              backgroundColor: "#fee000",
              color: "#000",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            View HRI dashboard
          </a>

          <a
            href="mailto:hello@humanreturnindex.com?subject=HRI%20Pilot%20Access"
            style={{
              display: "inline-block",
              padding: "0.8rem 1.3rem",
              borderRadius: 999,
              border: "1px solid #ddd",
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
              color: "#111",
            }}
          >
            Request pilot access
          </a>
        </div>

        <p
          style={{
            marginTop: 10,
            fontSize: 11,
            opacity: 0.65,
          }}
        >
          Current version: live pilot environment. Each organisation will see
          only their own data in production.
        </p>
      </section>

      {/* VALUE STRIP */}
      <section
        style={{
          borderRadius: 14,
          border: "1px solid #f3f3f3",
          padding: 16,
          background: "#fbfbfb",
          marginBottom: 28,
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          Human Return Index™ combines{" "}
          <strong>internal assessments</strong>,{" "}
          <strong>employee pulse surveys</strong> and{" "}
          <strong>hard business metrics</strong> to show:
        </p>
        <ul
          style={{
            marginTop: 8,
            marginBottom: 0,
            paddingLeft: 18,
            fontSize: 13,
            opacity: 0.9,
          }}
        >
          <li>where people are thriving vs. at risk across 5 core pillars</li>
          <li>what that means in real £ cost (turnover and absence)</li>
          <li>the gap between what you spend on people and what it’s returning</li>
        </ul>
      </section>

      {/* THREE COLUMNS */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <HomeCard
          title="One score everyone understands"
          body="No more guessing. One HRI score out of 100 that wraps culture, wellbeing and leadership into a language the C-suite and board can act on."
        />
        <HomeCard
          title="From symptoms to signals"
          body="See exactly which pillars are dragging performance – leadership, trust, inclusion, growth or mental health – and where to focus next."
        />
        <HomeCard
          title="Built for ROI conversations"
          body="Model the £ cost of turnover and absence against your current wellbeing and people investment, so you can prove impact instead of justifying spend."
        />
      </section>

      {/* FOOTER NOTE */}
      <section style={{ fontSize: 11, opacity: 0.65 }}>
        <p style={{ marginBottom: 4 }}>
          This environment is wired to a real database (Supabase) and a live
          scoring engine. For pilots we typically pre-load your organisation
          profile and run an initial HRI assessment with your leadership team.
        </p>
        <p style={{ margin: 0 }}>
          Ready to explore Human Return Index™ in your organisation? Drop a
          line to{" "}
          <a href="mailto:hello@humanreturnindex.com">
            hello@humanreturnindex.com
          </a>{" "}
          and we&apos;ll set up your pilot space.
        </p>
      </section>
    </main>
  );
}

function HomeCard({ title, body }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #f0f0f0",
        padding: 14,
        background: "#fff",
      }}
    >
      <h2
        style={{
          fontSize: 15,
          fontWeight: 700,
          marginBottom: 6,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        {body}
      </p>
    </div>
  );
}
