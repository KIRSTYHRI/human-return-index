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
          {/* Logo + wordmark (no external file, no 404) */}
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
            <N
