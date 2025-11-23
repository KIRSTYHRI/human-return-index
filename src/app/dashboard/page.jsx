"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [orgMetrics, setOrgMetrics] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [pulseSummary, setPulseSummary] = useState(null);
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
        setPulseSummary(j.pulse_summary || null);
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

  // Internal assessment scores (already 0–100)
  const assessmentScoreByPillar = scores.reduce((acc, s) => {
    if (s.pillar != null) {
      acc[s.pillar] = Number(s.score);
    }
    return acc;
  }, {});

  // Pulse scores come back as 1–5 → convert to 0–100
  const pulseItems = Array.isArray(pulseSummary)
    ? pulseSummary.map((p) => {
        const raw = Number(p.score || 0); // 1–5
        const scaled = raw * 20; // 0–100
        return { pillar: p.pillar, raw, score: scaled };
      })
    : [];

  const overallPulseScore =
    pulseItems.length > 0
      ? pulseItems.reduce((sum, p) => sum + p.score, 0) / pulseItems.length
      : null;

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
        data below is coming from your Supabase assessment and organisation
        settings.
      </p>

      {/* TOP SUMMARY – LATEST ASSESSMENT */}
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
            <MetricCard label="Organisation" value={orgMetrics.name || "–"} />
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
                  ? `£${orgMetrics.avg_salary.toLocaleString()}`
                  : "–"
              }
            />
            <MetricCard
              label="Turnover rate"
              value={
                orgMetrics.turnover_rate != null
                  ? `${orgMetrics.turnover_rate}%`
                  : "–"
              }
            />
            <MetricCard
              label="Absence days per employee"
              value={
                orgMetrics.absent_days_per_employee != null
                  ? orgMetrics.absent_days_per_employee
                  : "–"
              }
            />
            <MetricCard
              label="Annual wellbeing spend"
              value={
                orgMetrics.annual_wellbeing_spend != null
                  ? `£${orgMetrics.annual_wellbeing_spend.toLocaleString()}`
                  : "–"
              }
            />
            <MetricCard
              label="Engagement score"
              value={
                orgMetrics.engagement_score != null
                  ? `${orgMetrics.engagement_score}/100`
                  : "–"
              }
            />
          </div>
        </section>
      )}

      {/* QUICK ROI SNAPSHOT SECTION */}
      {roiSummary && (
        <section
          style={{
            border: "1px solid #f5e58a",
            background: "#fffdf0",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Quick ROI snapshot
          </h2>

          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
            Based on your current headcount, salary levels, turnover and
            absence, here’s an estimated annual cost of people risk versus your
            wellbeing investment.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <MetricCard
              label="Total payroll"
              value={
                roiSummary.total_payroll != null
                  ? `£${roiSummary.total_payroll.toLocaleString("en-GB")}`
                  : "–"
              }
            />

            <MetricCard
              label="Estimated turnover cost / year"
              value={
                roiSummary.estimated_turnover_cost != null
                  ? `£${roiSummary.estimated_turnover_cost.toLocaleString(
                      "en-GB"
                    )}`
                  : "–"
              }
            />

            <MetricCard
              label="Estimated absence cost / year"
              value={
                roiSummary.estimated_absence_cost != null
                  ? `£${roiSummary.estimated_absence_cost.toLocaleString(
                      "en-GB"
                    )}`
                  : "–"
              }
            />

            <MetricCard
              label="Total people risk / year"
              value={
                roiSummary.total_people_risk != null
                  ? `£${roiSummary.total_people_risk.toLocaleString("en-GB")}`
                  : "–"
              }
            />

            <MetricCard
              label="Wellbeing investment / year"
              value={
                roiSummary.annual_wellbeing_spend != null
                  ? `£${roiSummary.annual_wellbeing_spend.toLocaleString(
                      "en-GB"
                    )}`
                  : "–"
              }
            />

            <MetricCard
              label="People risk : wellbeing ratio"
              value={
                roiSummary.roi_multiplier != null
                  ? `${roiSummary.roi_multiplier.toFixed(1)}x`
                  : "–"
              }
            />
          </div>

          {roiSummary.roi_multiplier != null && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                opacity: 0.85,
              }}
            >
              In simple terms: for every £1 you invest in wellbeing, you&apos;re
              currently carrying around {roiSummary.roi_multiplier.toFixed(1)}x
              that in people risk (turnover + absence). Human Return Index™
              exists to close that gap.
            </p>
          )}
        </section>
      )}

      {/* PILLAR SCORES – INTERNAL ASSESSMENT */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Pillar Scores (Internal Assessment)
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          {scores.map((s) => (
            <div
              key={s.pillar}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ opacity: 0.7, fontSize: 12 }}>{s.pillar}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {Math.round(Number(s.score))}
              </div>
            </div>
          ))}
          {scores.length === 0 && (
            <div style={{ opacity: 0.7 }}>No pillar scores yet.</div>
          )}
        </div>
      </section>

      {/* EMPLOYEE PULSE SUMMARY + COMPARISON */}
      {pulseItems.length > 0 && (
        <section
          style={{
            border: "1px solid #dff0ff",
            background: "#f7fbff",
            borderRadius: 12,
            padding: 16,
            marginTop: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Latest Employee Pulse
          </h2>

          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
            Live sentiment snapshot across the 5 HRI pillars, compared to your
            internal assessment scores (all out of 100).
          </p>

          {overallPulseScore != null && (
            <div
              style={{
                marginBottom: 16,
                padding: 10,
                borderRadius: 10,
                border: "1px dashed #c7ddff",
                background: "#f0f6ff",
                fontSize: 13,
              }}
            >
              <strong>Overall pulse score:</strong>{" "}
              {Math.round(overallPulseScore)} / 100
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
              gap: 12,
            }}
          >
            {pulseItems.map((p) => {
              const pulseScore = p.score; // 0–100
              const assessmentScore = assessmentScoreByPillar[p.pillar];
              const hasAssessment = assessmentScore != null;
              const delta =
                hasAssessment && Number.isFinite(assessmentScore)
                  ? pulseScore - Number(assessmentScore)
                  : null;

              let deltaLabel = "No comparison yet";
              let deltaColour = "#666";

              if (delta != null && delta !== 0) {
                const arrow = delta > 0 ? "▲" : "▼";
                const direction = delta > 0 ? "higher" : "lower";
                deltaLabel = `${arrow} ${Math.abs(
                  Math.round(delta)
                )} vs assessment (${direction})`;
                deltaColour = delta > 0 ? "#0a7b3f" : "#b00020";
              } else if (delta === 0) {
                deltaLabel = "Matches internal assessment";
                deltaColour = "#444";
              }

              return (
                <div
                  key={p.pillar}
                  style={{
                    border: "1px solid #e6f0fa",
                    borderRadius: 10,
                    padding: 12,
                    background: "white",
                  }}
                >
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{p.pillar}</div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      marginBottom: 4,
                    }}
                  >
                    {Math.round(pulseScore)}
                  </div>
                  {hasAssessment && (
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                        marginBottom: 4,
                      }}
                    >
                      Internal assessment:{" "}
                      <strong>{Math.round(assessmentScore)}</strong>
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 12,
                      color: deltaColour,
                    }}
                  >
                    {deltaLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #f2f2f2",
        borderRadius: 10,
        padding: 10,
        background: "#fafafa",
      }}
    >
      <div style={{ opacity: 0.6, fontSize: 11 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}
