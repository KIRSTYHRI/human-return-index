"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [orgMetrics, setOrgMetrics] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [pulseSummary, setPulseSummary] = useState(null);
  const [error, setError] = useState(null);

  // Load all dashboard data from /api/overview
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

  // Error state
  if (error) {
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
          Human Return Index™ Dashboard
        </h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          Something went wrong while loading your data:
        </p>
        <pre
          style={{
            background: "#fff0f0",
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </pre>
      </main>
    );
  }

  // Loading state
  if (!overview) {
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
          Human Return Index™ Dashboard
        </h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          Loading your latest Human Return Index™ data…
        </p>
      </main>
    );
  }

  const overallScore =
    overview.overall_score != null
      ? Math.round(Number(overview.overall_score))
      : null;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      {/* PAGE HEADER */}
      <header
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Human Return Index™ Dashboard
          </h1>
          <p style={{ margin: 0, opacity: 0.8, fontSize: 14 }}>
            Real-time view of how your people are doing – and what that means
            for performance, risk and ROI.
          </p>
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #eee",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            background: "#fafafa",
          }}
        >
          Live preview · Internal use
        </div>
      </header>

      {/* TOP ROW: ASSESSMENT + PILLAR SUMMARY */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Assessment summary */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              opacity: 0.6,
              marginBottom: 4,
            }}
          >
            Latest assessment
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {overview.title || "Current Human Return Index™ assessment"}
          </div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              marginTop: 4,
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>
              Status:{" "}
              <strong style={{ textTransform: "capitalize" }}>
                {overview.status?.toLowerCase() || "–"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Period:{" "}
              <strong>
                {overview.period_start} → {overview.period_end}
              </strong>
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginTop: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* Overall score */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 4,
                }}
              >
                Overall HRI score
              </div>
              <div style={{ fontSize: 34, fontWeight: 800 }}>
                {overallScore != null ? `${overallScore}` : "–"}
                {overallScore != null && (
                  <span
                    style={{
                      fontSize: 16,
                      opacity: 0.6,
                      marginLeft: 4,
                      fontWeight: 500,
                    }}
                  >
                    / 100
                  </span>
                )}
              </div>
            </div>

            {/* Badge */}
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.6,
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                  marginBottom: 4,
                }}
              >
                Badge
              </div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {overview.badge_level || "No badge yet"}
              </div>
              {overview.badge_awarded_at && (
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                  Awarded:{" "}
                  {new Date(
                    overview.badge_awarded_at
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pillar scores */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.7,
              opacity: 0.6,
              marginBottom: 4,
            }}
          >
            Pillar scores (internal assessment)
          </div>
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
            Average scores across your five HRI pillars, all normalised to 0–100.
          </p>
          {scores.length === 0 ? (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              No pillar scores yet. Complete an assessment to populate this.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 8,
              }}
            >
              {scores.map((s) => (
                <div
                  key={s.pillar}
                  style={{
                    border: "1px solid #f2f2f2",
                    borderRadius: 10,
                    padding: 10,
                    background: "#fafafa",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    {s.pillar}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {Math.round(Number(s.score))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ORG METRICS + ROI ROW */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1fr)",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Org metrics */}
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            background: "#fff",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Organisation metrics
          </h2>
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
            Core people and cost inputs used to model your HRI score and people
            risk.
          </p>

          {orgMetrics ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
                gap: 10,
              }}
            >
              <MetricCard
                label="Organisation"
                value={orgMetrics.name || "Your organisation"}
              />
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
          ) : (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              No organisation metrics found. Add your data in the Organisation
              Settings page to unlock ROI insights.
            </div>
          )}
        </section>

        {/* Quick ROI snapshot */}
        <section
          style={{
            border: "1px solid #f7e9a6",
            borderRadius: 12,
            padding: 16,
            background: "#fffdf5",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Quick ROI snapshot
          </h2>
          <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
            A high-level estimate of your annual people risk (turnover +
            absence) compared with what you&apos;re currently investing in your
            people.
          </p>

          {roiSummary ? (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
                  gap: 8,
                  marginBottom: 10,
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
                      ? `£${roiSummary.total_people_risk.toLocaleString(
                          "en-GB"
                        )}`
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
                    fontSize: 12,
                    opacity: 0.85,
                  }}
                >
                  In simple terms: for every £1 you invest in wellbeing, you are
                  currently carrying around{" "}
                  <strong>{roiSummary.roi_multiplier.toFixed(1)}x</strong> that
                  amount in annual people risk. Human Return Index™ exists to
                  close that gap.
                </p>
              )}
            </>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Add your organisation metrics to calculate your people risk and
              wellbeing ROI.
            </div>
          )}
        </section>
      </section>

      {/* LATEST EMPLOYEE PULSE */}
      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          background: "#fff",
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Latest employee pulse
        </h2>
        <p style={{ fontSize: 12, opacity: 0.8, marginBottom: 10 }}>
          Live sentiment across the five HRI pillars, compared with your
          internal assessment. Pulse scores are shown on a 0–100 scale.
        </p>

        {!pulseSummary || pulseSummary.length === 0 ? (
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            No recent pulse responses yet. Once employees complete a pulse
            survey, you&apos;ll see the latest signal here.
          </div>
        ) : (
          <PulseComparisonGrid pulseSummary={pulseSummary} scores={scores} />
        )}
      </section>
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
      <div style={{ fontWeight: 700, marginTop: 4, fontSize: 13 }}>{value}</div>
    </div>
  );
}

function PulseComparisonGrid({ pulseSummary, scores }) {
  // Build a lookup for internal assessment pillar scores
  const assessmentByPillar = new Map();
  for (const s of scores || []) {
    assessmentByPillar.set(s.pillar, Number(s.score));
  }

  // Convert pulse scores (1–5 average) → 0–100
  const rows = (pulseSummary || []).map((p) => {
    const pulseScore01to5 = Number(p.score);
    const pulseScore100 = Math.round((pulseScore01to5 / 5) * 100);
    const assessmentScore = assessmentByPillar.has(p.pillar)
      ? Math.round(assessmentByPillar.get(p.pillar))
      : null;
    const diff =
      assessmentScore != null ? pulseScore100 - assessmentScore : null;

    return {
      pillar: p.pillar,
      pulseScore: pulseScore100,
      assessmentScore,
      diff,
    };
  });

  const validPulse = rows.filter(
    (r) => Number.isFinite(r.pulseScore) && r.assessmentScore != null
  );
  const overallPulse =
    validPulse.length > 0
      ? Math.round(
          validPulse.reduce((sum, r) => sum + r.pulseScore, 0) /
            validPulse.length
        )
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Overall pulse */}
      <div
        style={{
          borderRadius: 10,
          padding: 10,
          background: "#fafafa",
          border: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              opacity: 0.7,
              textTransform: "uppercase",
              letterSpacing: 0.7,
            }}
          >
            Overall pulse score
          </div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Average across the latest pulse responses by pillar.
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>
          {overallPulse != null ? `${overallPulse} / 100` : "–"}
        </div>
      </div>

      {/* Per-pillar comparison */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
          gap: 10,
        }}
      >
        {rows.map((row) => {
          const { pillar, pulseScore, assessmentScore, diff } = row;

          let diffLabel = "No comparison";
          let diffSymbol = "";
          let diffColour = "#666";

          if (diff != null && !Number.isNaN(diff)) {
            if (diff > 0) {
              diffLabel = `${Math.abs(diff)} higher than assessment`;
              diffSymbol = "▲";
              diffColour = "#0a7a43";
            } else if (diff < 0) {
              diffLabel = `${Math.abs(diff)} lower than assessment`;
              diffSymbol = "▼";
              diffColour = "#b32525";
            } else {
              diffLabel = "Matches assessment";
              diffSymbol = "●";
              diffColour = "#777";
            }
          }

          return (
            <div
              key={pillar}
              style={{
                borderRadius: 10,
                padding: 10,
                border: "1px solid #f2f2f2",
                background: "#fafafa",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                {pillar}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Pulse score (0–100)
                </div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {Number.isFinite(pulseScore) ? pulseScore : "–"}
                </div>
              </div>

              <div style={{ fontSize: 12, opacity: 0.8 }}>
                Internal assessment:{" "}
                <strong>
                  {assessmentScore != null ? assessmentScore : "–"}
                </strong>
              </div>

              {diff != null && !Number.isNaN(diff) && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: diffColour,
                  }}
                >
                  <span>{diffSymbol}</span>
                  <span>{diffLabel}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
