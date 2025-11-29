// src/app/layout.js  (or layout.jsx)
import "./globals.css";

export const metadata = {
  title: "Human Return Index™",
  description:
    "The KPI for human return. Real-time view of how your people are doing – and what that means for performance, risk and ROI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Yellow demo strip */}
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

        {/* Top nav with logo */}
        <header
          style={{
            background:
              "linear-gradient(to right, #020617 0%, #020617 40%, #020617 100%)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.4)",
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
            {/* HRI logo / wordmark – simple version inspired by your site */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, #FEE000 0%, #FACC15 40%, #F97316 100%)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  padding: 4,
                }}
              >
                {/* three bars icon */}
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    alignItems: "flex-end",
                    height: "100%",
                  }}
                >
                  <span
                    style={{
                      width: 3,
                      height: "40%",
                      background: "#020617",
                      borderRadius: 999,
                    }}
                  />
                  <span
                    style={{
                      width: 3,
                      height: "65%",
                      background: "#020617",
                      borderRadius: 999,
                    }}
                  />
                  <span
                    style={{
                      width: 3,
                      height: "90%",
                      background: "#020617",
                      borderRadius: 999,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontWeight: 800,
                    letterSpacing: 0.4,
                    fontSize: 16,
                  }}
                >
                  Human Return Index™
                </span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    textTransform: "uppercase",
                  }}
                >
                  People-first KPI for modern organisations
                </span>
              </div>
            </div>

            {/* Simple nav */}
            <nav
              style={{
                display: "flex",
                gap: 16,
                fontSize: 13,
                alignItems: "center",
              }}
            >
              <NavLink href="/">Overview</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/dashboard/hri-assessment">
                Internal Assessment
              </NavLink>
              <NavLink href="/dashboard/employee-pulse">
                Employee Pulse
              </NavLink>
              <NavLink href="/dashboard/settings">Org Inputs</NavLink>
            </nav>
          </div>
        </header>

        {/* Page content wrapper */}
        <main
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "24px 24px 40px",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}

/** Small helper component for nav links */
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
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {children}
    </a>
  );
}
