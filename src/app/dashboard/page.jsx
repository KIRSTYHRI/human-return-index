"use client";

import { useEffect, useState } from "react";
import CurrentAssessmentCard from "./CurrentAssessmentCard";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [orgMetrics, setOrgMetrics] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/overview", { cache: "no-store" });
        const j = await r.json();

        if (!r.ok || !j.ok) {
          throw new Error(j.error || "Error loading data");
        }

        setOverview(j.overview);
        setScores(j.scores || []);
        setOrgMetrics(j.org_metrics || null);
        setRoiSummary(j.roi_summary || null);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message);
      }
    })();
  }, []);

  if (error) {
    return (
      <main style={{ padding: 24, color: "crimson", fontFamily: "system-ui" }}>
        <h1>Human Return Index™ – Pilot Dashboard</h1>
        <p>Something went wrong loading your data:</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </main>
    );
  }

  if (!overview) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Human Return Index™ – Pilot Dashboard</h1>
        <p>Loading your latest HRI data…</p>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Human Return Index™ – Pilot Dashboard
      </h1>
      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        This is your live preview of the Human Return Index™ dashboard. The
        data below is coming from your Supabase “Pilot Test” assessment and
        organisation settings.
      </p>

      {/* ✅ NEW — LIVE CURRENT ASSESSMENT CARD */}
      <CurrentAssessmentCard />

      {/* TOP SUMMARY (kept exactly as you had it) */}
      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>Latest Assessment</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{overview.title}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Status: {overview.status} • Period: {overview.period_start} →{" "}
            {overview.period_end}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Created:{" "}
            {overview.assessment_created_at
              ? new Date(overview.assessment_created_at).toLocaleDateString()
              : "-"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ opacity: 0.6, fontSize: 12 }}>Overall HRI Score</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {overview.overall_score != null
              ? Math.round(overview.overall_score)
              : "–"}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Badge</div>
            <div style={{ fontWeight: 700 }}>
              {overview.badge_level || "No badge yet"}
            </div>
            {overview.badge_awarded_at && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Awarded:{" "}
                {new Date(overview.badge_awarded_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ORG METRICS */}
      {orgMetrics && (
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Organisation metrics
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <MetricCard label="Organisation" value={orgMetrics.name} />
            <MetricCard
              label="Employees"
              value={
                orgMetrics.employee_count != null
                  ? orgMetrics.employee_count.toLocaleString()
                  : "–"
              }
            />
            <MetricCard
              label="Average salary"
              value={
                orgMetrics.avg_salary != null
