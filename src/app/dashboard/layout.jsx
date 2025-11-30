// src/app/dashboard/layout.jsx

export const metadata = {
  title: "Human Return Index™ Dashboard",
};

export default function DashboardLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111827",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top bar / logo */}
      <header
        style={{
          borderBottom: "1px solid #E5E7EB",
          background: "#ffffff",
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
          {/* Logo + wordmark (inline SVG – no files, no 404s) */}
          <a
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "#111827",
            }}
          >
            {/* HRI icon – yellow bars + dot */}
            <div
              style={{
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                viewBox="0 0 100 100"
                width="32"
                height="32"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* three yellow bars */}
                <rect
                  x="8"
                  y="55"
                  width="14"
                  height="30"
                  rx="3"
                  fill="#FEE000"
                />
                <rect
                  x="28"
                  y="45"
                  width="14"
                  height="40"
                  rx="3"
                  fill="#FEE000"
                />
                <rect
                  x="48"
                  y="30"
                  width="14"
                  height="55"
                  rx="3"
                  fill="#FEE000"
                />
                {/* circle dot */}
                <circle cx="70" cy="24" r="6" fill="#FEE000" />
              </svg>
            </div>

            {/* Text wordmark */}
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

          {/* Nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 12,
            }}
          >
            <NavLink href="/dashboard">Overview</NavLink>
            <NavLink href="/dashboard/hri-assessment">
              Internal assessment
            </NavLink>
            <NavLink href="/dashboard/employee-pulse">
              Employee pulse
            </NavLink>
            <NavLink href="/dashboard/settings">Org inputs</NavLink>
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

/** Small helper for nav links */
function NavLink({ href, children }) {
  return (
    <a
      href={href}
      style={{
        color: "#4B5563",
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
