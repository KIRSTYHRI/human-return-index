"use client";

import { useEffect, useState } from "react";

export default function AssessmentDetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(`/api/assessments/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load assessment");
        }

        setData(json);
      } catch (err) {
        console.error("Error loading assessment detail:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
          color: "#f7f7f7",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Assessment Detail
        </h1>
        <p style={{ opacity: 0.9 }}>Loading assessment…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
          color: "#ff6b6b",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Assessment Detail
        </h1>
        <p>Something went wrong:</p>
        <pre style={{ whiteSpace: "pre-wrap", color: "#f7f7f7" }}>
          {error || "No data"}
        </pre>
      </main>
    );
  }

  const { assessment, scores = [], org_metrics: orgMetrics, roi_summary: roi } =
    data;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
        color: "#f7f7f7",
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 24 }}>
        <a
          href="/dashboard/assessments"
          style={{
            fontSize: 13,
            textDecoration: "underline",
            color: "#fee000",
            display: "inline-block",
            marginBottom: 8,
          }}
        >
          ← Back to assessments
        </a>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          {assessment?.title || "Assessment"}
        </h1>
        <p style={{ opacity: 0.9, fontSize: 14 }}>
          Created:{" "}
          {assessment?.created_at
            ? new Date(assessment.created_at).toLocaleDateString()
            : "-"}{" "}
          • Status: {assessment?.status || "-"}
        </p>
      </header>

      {/* TOP SUMMARY */}
      <section
        style={{
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          background: "#0d0d0d",
          border: "1px solid #333333",
          display: "flex",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.7 }}>
            Assessment period
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {assessment?.period_start} → {assessment?.period_end}
          </div>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
            This assessment contributes directly to your Human Return Index™
            score and ROI story.
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", opacity: 0.7 }}>
            Badge
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            {assessment?.badge_level || "No badge awarded"}
          </div>
          {assessment?.badge_awarded_at && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Awarded:{" "}
              {new Date(assessment.badge_awarded_at).toLocaleDateString()}
            </div>
          )}
          {assessment?.is_current && (
            <div
              style={{
                marginTop: 8,
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 999,
                background: "#fee000",
                color: "#050505",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Current HRI assessment
            </div>
          )}
        </div>
      </section>

      {/* ORG METRICS (IF PRESENT) */}
      {orgMetrics && (
        <section
          style={{
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            background: "#0d0d0d",
            border: "1px solid #333333",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Organisation snapshot (at time of this assessment)
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
                  ? `£${orgMetrics.avg_salary.toLocaleString("en-GB")}`
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
                  ? `£${orgMetrics.annual_wellbeing_spend.toLocaleString(
                      "en-GB"
                    )}`
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

      {/* ROI SNAPSHOT (IF PRESENT) */}
      {roi && (
        <section
          style={{
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            background: "#111111",
            border: "1px solid #555022",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            ROI snapshot for this period
          </h2>
          <p style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>
            This is a high-level view of people risk versus wellbeing investment
            during this assessment window.
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
                roi.total_payroll != null
                  ? `£${roi.total_payroll.toLocaleString("en-GB")}`
                  : "–"
              }
            />
            <MetricCard
              label="Estimated turnover cost / year"
              value={
                roi.estimated_turnover_cost != null
                  ? `£${roi.estimated_turnover_cost.toLocaleString("en-GB")}`
                  : "–"
              }
            />
            <MetricCard
              label="Estimated absence cost / year"
              value={
                roi.estimated_absence_cost != null
                  ? `£${roi.estimated_absence_cost.toLocaleString("en-GB")}`
                  : "–"
              }
            />
            <MetricCard
              label="Total people risk / year"
              value={
                roi.total_people_risk != null
                  ? `£${roi.total_people_risk.toLocaleString("en-GB")}`
                  : "–"
              }
            />
            <MetricCard
              label="Wellbeing investment / year"
              value={
                roi.annual_wellbeing_spend != null
                  ? `£${roi.annual_wellbeing_spend.toLocaleString("en-GB")}`
                  : "–"
              }
            />
            <MetricCard
              label="People risk : wellbeing ratio"
              value={
                roi.roi_multiplier != null
                  ? `${roi.roi_multiplier.toFixed(1)}x`
                  : "–"
              }
            />
          </div>

          {roi.roi_multiplier != null && (
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                opacity: 0.95,
              }}
            >
              Translation: for every £1 you&apos;re investing in wellbeing, you&apos;re
              currently carrying around{" "}
              {roi.roi_multiplier.toFixed(1)}x that in avoidable people risk.
            </p>
          )}
        </section>
      )}

      {/* PILLAR SCORES */}
      <section
        style={{
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          background: "#0d0d0d",
          border: "1px solid #333333",
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Pillar Scores
        </h2>
        {scores.length === 0 ? (
          <p style={{ opacity: 0.8 }}>No pillar scores recorded for this assessment.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {scores.map((s) => (
              <div
                key={s.pillar}
                style={{
                  borderRadius: 10,
                  padding: 12,
                  background: "#161616",
                  border: "1px solid #333333",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {s.pillar}
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    marginTop: 4,
                    color: "#fee000",
                  }}
                >
                  {Math.round(Number(s.score))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 10,
        padding: 10,
        background: "#161616",
        border: "1px solid #333333",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, marginTop: 4, fontSize: 14 }}>
        {value}
      </div>
    </div>
  );
}
