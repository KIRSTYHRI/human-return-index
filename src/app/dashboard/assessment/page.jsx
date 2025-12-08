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
        Internal Assessment (placeholder)
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          maxWidth: 680,
        }}
      >
        This route is just a placeholder. The full 25-question Human Return
        Index™ internal assessment now lives at{" "}
        <code>/dashboard/hri-assessment</code> and is wired to your Supabase
        employer questions.
      </p>
    </div>
  );
}
