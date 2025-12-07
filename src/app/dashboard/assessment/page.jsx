// src/app/dashboard/assessment/page.jsx
"use client";

import Link from "next/link";

export default function LegacyAssessmentLanding() {
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
        Human Return Index™ – Internal Assessment
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          marginBottom: 16,
        }}
      >
        This page has moved. Your full 25-question HRI assessment now
        lives in the main dashboard experience.
      </p>

      <p
        style={{
          fontSize: 14,
          color: "#D1D5DB",
          marginBottom: 12,
        }}
      >
        Please use the link below to access the latest internal
        assessment view:
      </p>

      <Link
        href="/dashboard/hri-assessment"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 999,
          background: "#FACC15",
          color: "#111827",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Go to HRI Internal Assessment
      </Link>
    </div>
  );
}
