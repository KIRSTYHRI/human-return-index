import Link from "next/link";

export const dynamic = "force-dynamic";

function NavBtn({ href, label }) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #1F2937",
        background: "#0B1220",
        color: "#E5E7EB",
        textDecoration: "none",
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }) {
  // 🚫 NO server-side redirect here. We keep MVP unblocked.
  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#E5E7EB" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 28px" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 14px",
            border: "1px solid #1F2937",
            borderRadius: 16,
            background: "#070A12",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>Human Return Index™</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Dashboard</div>
          </div>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NavBtn href="/dashboard" label="Overview" />
            <NavBtn href="/dashboard/hri-assessment" label="HRI Assessment" />
            <NavBtn href="/dashboard/employee-pulse" label="Employee Pulse" />
            <NavBtn href="/dashboard/scores" label="Scores" />
            <NavBtn href="/dashboard/settings" label="Settings" />
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
