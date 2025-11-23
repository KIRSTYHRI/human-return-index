export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>
        Human Return Index™
      </h1>

      <p style={{ marginBottom: 12 }}>
        Welcome to the Human Return Index™ – the live dashboard that connects
        wellbeing, culture and performance in one place.
      </p>

      <p style={{ marginBottom: 24 }}>
        Use your HRI dashboard to see how “well” your organisation is really
        doing – across leadership, trust, inclusion, growth, wellbeing – and how
        that links directly to people risk and ROI.
      </p>

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
        }}
      >
        Open HRI Dashboard
      </a>

      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        Powered by Next.js on Vercel + Supabase. This is your working HRI
        product – reading live data from your assessments, employee pulse and
        organisation metrics.
      </p>
    </main>
  );
}
