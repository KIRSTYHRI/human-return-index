import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", padding: 32, maxWidth: 980, margin: "0 auto" }}>
      <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 10 }}>Human Return Index™</h1>
      <p style={{ fontSize: 18, lineHeight: 1.5, marginBottom: 24 }}>
        Your workplace wellbeing, culture and performance — scored like a credit score.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href="/login" style={{ padding: "10px 14px", border: "1px solid #333", borderRadius: 10 }}>
          Login
        </Link>
        <Link href="/dashboard" style={{ padding: "10px 14px", border: "1px solid #333", borderRadius: 10 }}>
          Dashboard
        </Link>
      </div>
    </main>
  );
}
