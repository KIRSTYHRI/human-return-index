// src/app/dashboard/assessment/page.jsx

export default function AssessmentPage() {
  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        color: "#E5E7EB",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Internal Assessment (test)
      </h1>
      <p style={{ fontSize: 14 }}>
        If you can see this, the <code>/dashboard/assessment</code> route is
        wired correctly.
      </p>
    </div>
  );
}
