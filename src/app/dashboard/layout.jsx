// src/app/dashboard/layout.jsx

export default function DashboardLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
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
              src="https://www.humanreturnindex.com/hri-logo-new.png"
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
              <span style={{ fontSize: 11, opacity: 0.7 }}>
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
            <NavLink href="/dashboard">Overview</NavLink>
            <NavLink href="/dashboard/hri-assessment">Assessment</NavLink>
            <NavLink href="/dashboard/employee-pulse">Employee pulse</NavLink>
            <NavLink href="/dashboard/settings">Org inputs</NavLink>
          </nav>
        </div>
      </header>

      {/* Yellow pilot strip */}
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
          <span style={{ opacity: 0.8 }}>HRI – the new KPI for human return</span>
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

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      style={{
        color: "#E5E7EB",
        textDecoration: "none",
        fontWeight: 500,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid transparent",
      }}
    >
      {children}
    </a>
  );
}
