import Link from "next/link";
import CurrentAssessmentCard from "./CurrentAssessmentCard";

export const dynamic = "force-dynamic";

function Card({ title, desc, href, cta = "Open" }) {
  return (
    <div
      style={{
        border: "1px solid #1F2937",
        borderRadius: 16,
        padding: 16,
        background:
          "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900, color: "#F9FAFB" }}>{title}</div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6, lineHeight: 1.4 }}>
        {desc}
      </div>

      <div style={{ marginTop: 12 }}>
        <Link
          href={href}
          style={{
            display: "inline-block",
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #FEE000",
            background: "#FEE000",
            color: "#111827",
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

export default function DashboardHomePage() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 6 }}>Dashboard</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Your HRI snapshot — scores, actions, and the bits that actually move the needle.
      </p>

      {/* ✅ This should bring back your score/current assessment widget */}
      <div style={{ marginBottom: 16 }}>
        <CurrentAssessmentCard />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        <Card
          title="Scores"
          desc="View your latest HRI scoring breakdown and pillar performance."
          href="/dashboard/scores"
          cta="View scores"
        />
        <Card
          title="Assessments"
          desc="See completed assessments and run a new one when you’re ready."
          href="/dashboard/assessments"
          cta="View assessments"
        />
        <Card
          title="Employee Pulse"
          desc="Collect anonymous pulse responses and track trends over time."
          href="/dashboard/employee-pulse"
          cta="Open pulse"
        />
        <Card
          title="Settings"
          desc="Manage organisation details and account settings."
          href="/dashboard/settings"
          cta="Settings"
        />
      </div>
    </main>
  );
}
