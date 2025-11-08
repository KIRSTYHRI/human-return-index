export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 12 }}>
        Human Return Index™ – Pilot
      </h1>

      <p style={{ marginBottom: 12 }}>
        Welcome to the Human Return Index™ pilot experience. This is a live,
        working preview of the HRI dashboard that brings together wellbeing,
        culture and performance in one place.
      </p>

      <p style={{ marginBottom: 24 }}>
        Right now the data you’ll see is sample data only while we wire in the
        full Supabase backend and scoring engine. The layout and flow are
        designed so organisations can quickly see how “well” their people are
        doing – and how that links to performance.
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
        Open Pilot Dashboard
      </a>

      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.7 }}>
        Behind the scenes: Next.js on Vercel + Supabase. You’re looking at the
        very first version of the Human Return Index™ product.
      </p>
    </main>
  );
}
