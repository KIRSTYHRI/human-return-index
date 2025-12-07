// src/app/dashboard/assessment/page.jsx
"use client";

export default function AssessmentPage() {
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
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        Internal Assessment
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          maxWidth: 680,
        }}
      >
        This route is just a placeholder. Please use{" "}
        <strong>Assessment</strong> in the main navigation, which points to{" "}
        the full Human Return Index™ internal assessment at{" "}
        <code>/dashboard/hri-assessment</code>.
      </p>
    </div>
  );
}
