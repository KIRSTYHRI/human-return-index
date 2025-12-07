// src/app/dashboard/assessment/page.jsx

export const metadata = {
  title: "Human Return Index™ – Internal Assessment",
};

export default function AssessmentLandingPage() {
  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#E5E7EB",
      }}
    >
      <section style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Human Return Index™ – Internal Assessment
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#9CA3AF",
            marginBottom: 8,
          }}
        >
          This is your leadership view of how things are really working
          across the five HRI pillars. Your full 25-question assessment
          lives on the dedicated HRI Assessment page.
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#9CA3AF",
          }}
        >
          Use it to set your baseline and then compare it with live
          employee pulse data and hard ROI metrics.
        </p>
      </section>

      <a
        href="/dashboard/hri-assessment"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          borderRadius: 999,
          border: "1px solid #FACC15",
          background: "#FACC15",
          color: "#111827",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
          marginTop: 4,
        }}
      >
        Go to full HRI Assessment
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
