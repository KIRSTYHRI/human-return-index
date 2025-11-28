// src/app/layout.jsx
import "./globals.css";

export const metadata = {
  title: "Human Return Index™",
  description:
    "The KPI for human return. Real-time view of how your people are doing – and what that means for performance, risk and ROI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#020617", // near-black / dark navy
          color: "#F9FAFB", // off-white
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Top yellow demo strip */}
        <div
          style={{
            width: "100%",
            background: "#FEE000",
            color: "#111827",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            padding: "6px 12px",
          }}
        >
          DEMO MODE · Experience the Human Return Index™ pilot – built to scale,
          powered by people.
        </div>

        {/* Simple HRI nav bar */}
        <header
          style={{
            borderBottom: "1px solid rgba(148, 163, 184, 0.25)",
            background:
              "linear-gradient(to right, #020617 0%, #020617 40%, #020617 100%)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              padding: "12px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
            }}
          >
            {/* Logo / wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background:
                    "linear-gradient(135deg, #FACC15 0%, #F97316 100%)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  padding: 4,
                }}
              >
                {/* simple bar icon */}
                <div
                  style={{
                    display: "flex",
                    gap: 2,
                    alignItems: "flex-end",
                    height: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 3,
                      height: "40%",
                      background: "#111827",
                      borderRadius: 999,
                    }}
                  />
                  <span
                    style={{
                      width: 3,
                      height: "65%",
                      background: "#111827",
                      borderRadius: 999,
                    }}
                  />
                  <span
                    style={{
                      width: 3,
                      height: "90%",
                      background: "#111827",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  fontSize: 16,
                }}
              >
                HRI
              </span>
            </div>

            {/* Nav links */}
            <nav
              style={{
                display: "flex",
                gap: 18,
                fontSize: 13,
                alignItems: "center",
              }}
            >
              <a href="/" style={navLinkStyle}>
                Overview
              </a>
              <a href="/dashboard" style={navLinkStyle}>
                Dashboard
              </a>
              <a href="/dashboard/hri-assessment" style={navLinkStyle}>
                Internal Assessment
              </a>
              <a href="/dashboard/employee-pulse" style={navLinkStyle}>
                Employee Pulse
              </a>
              <a href="/dashboard/settings" style={navLinkStyle}>
                Org Inputs
              </a>
            </nav>
          </div>
        </header>

        {/* Page content wrapper */}
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 24px 40px",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}

// small helper for nav links
const navLinkStyle = {
  color: "#E5E7EB",
  textDecoration: "none",
  fontWeight: 500,
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid transparent",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};
