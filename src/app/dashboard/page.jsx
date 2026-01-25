"use client";

import CurrentAssessmentCard from "./CurrentAssessmentCard";

export default function DashboardOverview() {
  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 1000, marginBottom: 16 }}>
        Overview
      </h1>

      <CurrentAssessmentCard />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginTop: 18,
        }}
      >
        <a href="/dashboard/assessments" style={cardLinkStyle}>
          Assessments →
          <div style={muted}>View and manage employer assessments</div>
        </a>

        <a href="/dashboard/scores" style={cardLinkStyle}>
          Scores →
          <div style={muted}>See pillar scores and overall HRI</div>
        </a>

        <a href="/dashboard/employee-pulse" style={cardLinkStyle}>
          Employee Pulse →
          <div style={muted}>Run a quick pulse check</div>
        </a>

        <a href="/dashboard/settings" style={cardLinkStyle}>
          Settings →
          <div style={muted}>Org details and configuration</div>
        </a>
      </div>
    </main>
  );
}

const cardLinkStyle = {
  display: "block",
  padding: 16,
  borderRadius: 14,
  border: "1px solid #1F2937",
  background: "#070A12",
  color: "#E5E7EB",
  textDecoration: "none",
  fontWeight: 900,
};

const muted = { marginTop: 6, fontSize: 13, color: "#9CA3AF", fontWeight: 600 };
