// src/app/dashboard/layout.jsx

export const metadata = {
  title: "Human Return Index™ Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #020617 0, #020617 40%, #020617 100%)",
        color: "#E5E7EB",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top bar / logo */}
      <header
        style={{
          borderBottom: "1px solid rgba(148,163,184,0.3)",
          background:
            "linear-gradient(to right, #020617, #020617 40%, #111827 100%)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <a
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <img
              src="/hri-logo.svg"
              alt="Human Return Index logo"
              style={{ height: 26 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontWeight: 700,
                  letterSpacing: 0.04,
                  fontSize: 14,
                }}
              >
                Human Return Index™
              </span>
              <span
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                }}
              >
                People-first KPI for modern organisations
              </span>
            </div>
          </a>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
            }}
          >
            <a
              href="/dashboard"
              style={{ opacity: 0.9, textDecoration: "none", color: "#E5E7EB" }}
            >
              Overview
            </a>
            <a
              href="/dashboard/assessment"
              style={{ opacity: 0.8, textDecoration: "none", color: "#CBD5F5" }}
            >
              Assessment
            </a>
            <a
              href="/dashboard/employee-pulse"
              style={{ opacity: 0.8, textDecoration: "none", color: "#CBD5F5" }}
            >
              Employee pulse
            </a>
            <a
              href="/dashboard/settings"
              style={{ opacity: 0.8, textDecoration: "none", color: "#CBD5F5" }}
            >
              Org inputs
            </a>
          </nav>
        </div>
      </header>

      {/* Little yellow pilot strip */}
      <div
        style={{
          background: "#FEE000",
          color: "#111827",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.08,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "4px 16px",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span>Live pilot environment · Internal use only</span>
          <span style={{ opacity: 0.8 }}>
            HRI – the new KPI for human return
          </span>
        </div>
      </div>

      {/* Main dashboard area */}
      <main
        style={{
          maxWidth: 1120,
          margin: "24px auto 40px",
          padding: "0 16px 32px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
