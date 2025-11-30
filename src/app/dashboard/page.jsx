"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [orgMetrics, setOrgMetrics] = useState(null);
  const [roiSummary, setRoiSummary] = useState(null);
  const [pulseSummary, setPulseSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load dashboard data");
        }

        setOverview(json.overview || null);
        setScores(json.scores || []);
        setOrgMetrics(json.org_metrics || null);
        setRoiSummary(json.roi_summary || null);
        setPulseSummary(json.pulse_summary || null);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ERROR STATE
  if (error) {
    return (
      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "24px 24px 40px",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
          Human Return Index™ Dashboard
        </h1>
        <p
          style={{
            marginBottom: 16,
            fontSize: 14,
            color: "#4b5563",
          }}
        >
          Something went wrong loading your data:
        </p>
        <pre
          style={{
            background: "#111827",
            color: "#f9fafb",
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            whiteSpace: "pre-wrap",
            border: "1px solid #374151",
          }}
        >
          {error}
        </pre>
      </main>
    );
  }

  // LOADING STATE
  if (loading || !overview) {
    return (
      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "24px 24px 40px",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ Dashboard
        </h1>
        <p style={{ fontSize: 14, color: "#4b5563" }}>
          Loading your latest HRI data…
        </p>
      </main>
    );
  }

  // Internal pillar scores from assessment
  const internalScoresByPillar = new Map();
  for (const s of scores) {
    if (!s?.pillar) continue;
    internalScoresByPillar.set(s.pillar, Number(s.score) || 0);
  }

  // Pulse scores: convert 1–5 to 0–100
  const pulseItems = Array.isArray(pulseSummary)
    ? pulseSummary.map((p) => {
        const raw = Number(p.score) || 0;
        const score100 = Math.round(raw * 20); // 1–5 -> 20–100
        const assessmentScore = internalScoresByPillar.get(p.pillar) ?? null;
        const diff =
          assessmentScore != null ? score100 - Number(assessmentScore) : null;

        return {
          pillar: p.pillar,
          score100,
          assessmentScore,
          diff,
        };
      })
    : [];

  const overallPulseScore =
    pulseItems.length > 0
      ? Math.round(
          pulseItems.reduce((sum, item) => sum + item.score100, 0) /
            pulseItems.length
        )
      : null;

  // MAIN DASHBOARD
  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* INTRO */}
      <section style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
          Human Return Index™ Dashboard
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#4b5563",
          }}
        >
          Real-time view of how your people are doing – and what that means for
          performance, risk and ROI.
        </p>
        <div
          style={{
            marginTop: 10,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#6b7280",
          }}
        >
          LIVE PILOT ENVIRONMENT · INTERNAL USE
        </div>
      </section>

      {/* GRID LAYOUT */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.6fr)",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Latest Assessment Card */}
          <section
            style={{
              background: "#020617",
              borderRadius: 16,
              border: "1px solid #1f2937",
              padding: 18,
              color: "#e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#9ca3af",
                    marginBottom: 4,
                  }}
                >
                  Latest Assessment
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#f9fafb",
                  }}
                >
                  {overview.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginTop: 4,
                  }}
                >
                  Status:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {overview.status || "UNKNOWN"}
                  </span>{" "}
                  · Period: {overview.period_start} → {overview.period_end}
                </div>
                {overview.assessment_created_at && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    Created:{" "}
                    {new Date(
                      overview.assessment_created_at
                    ).toLocaleDateString("en-GB")}
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#9ca3af",
                  }}
                >
                  Overall HRI Score
                </div>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 800,
                    color: "#f9fafb",
                    marginTop: 4,
                  }}
                >
                  {overview.overall_score != null
                    ? `${Math.round(overview.overall_score)}`
                    : "–"}
                  <span style={{ fontSize: 16, opacity: 0.7 }}> / 100</span>
                </div>

                <div style={{ marginTop: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#9ca3af",
                    }}
                  >
                    Badge
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      padding: "4px 10px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      borderRadius: 999,
                      border: "1px solid #facc15",
                      background:
                        "linear-gradient(135deg, #0f172a 0%, #111827 60%, #1e293b 100%)",
                      color: "#facc15",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "999px",
                        background: "#facc15",
                      }}
                    />
                    {overview.badge_level || "No badge yet"}
                  </div>
                  {overview.badge_awarded_at && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                        marginTop: 4,
                      }}
                    >
                      Awarded:{" "}
                      {new Date(
                        overview.badge_awarded_at
                      ).toLocaleDateString("en-GB")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Pillar Scores */}
          <section
            style={{
              background: "#020617",
              borderRadius: 16,
              border: "1px solid "#1f2937",
              padding: 18,
              color: "#e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 10,
                gap: 8,
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#f9fafb",
                    marginBottom: 2,
                  }}
                >
                  Pillar scores (internal assessment)
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    maxWidth: 440,
                  }}
                >
                  Average scores across your five HRI pillars, all normalised to
                  a 0–100 scale.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
              }}
            >
              {scores.map((s) => (
                <PillarCard key={s.pillar} pillar={s.pillar} score={s.score} />
              ))}
              {scores.length === 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    paddingTop: 4,
                  }}
                >
                  No pillar scores yet. Complete an internal assessment to see
                  your HRI breakdown.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Org metrics */}
          <section
            style={{
              background: "#020617",
              borderRadius: 16,
              border: "1px solid #1f2937",
              padding: 18,
              color: "#e5e7eb",
            }}
          >
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#f9fafb",
                marginBottom: 4,
              }}
            >
              Organisation metrics
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                marginBottom: 10,
              }}
            >
              Core people and cost inputs used to model your HRI score and
              people risk.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 10,
                marginTop: 6,
              }}
            >
              <MetricCard
                label="Organisation"
                value={
                  orgMetrics?.name ||
                  orgMetrics?.organisation_name ||
                  "Your organisation"
                }
              />
              <MetricCard
                label="Employees"
                value={
                  orgMetrics?.employee_count != null
                    ? orgMetrics.employee_count.toLocaleString("en-GB")
                    : "–"
                }
              />
              <MetricCard
                label="Average salary"
                value={
                  orgMetrics?.avg_salary != null
                    ? `£${orgMetrics.avg_salary.toLocaleString("en-GB")}`
                    : "–"
                }
              />
              <MetricCard
                label="Turnover rate"
                value={
                  orgMetrics?.turnover_rate != null
                    ? `${orgMetrics.turnover_rate}%`
                    : "–"
                }
              />
              <MetricCard
                label="Absence days per employee"
                value={
                  orgMetrics?.absent_days_per_employee != null
                    ? orgMetrics.absent_days_per_employee
                    : "–"
                }
              />
              <MetricCard
                label="Annual wellbeing spend"
                value={
                  orgMetrics?.annual_wellbeing_spend != null
                    ? `£${orgMetrics.annual_wellbeing_spend.toLocaleString(
                        "en-GB"
                      )}`
                    : "–"
                }
              />
              <MetricCard
                label="Engagement score"
                value={
                  orgMetrics?.engagement_score != null
                    ? `${orgMetrics.engagement_score}/100`
                    : "–"
                }
              />
            </div>
          </section>

          {/* Quick ROI Snapshot */}
          {roiSummary && (
            <section
              style={{
                background: "#020617",
                borderRadius: 16,
                border: "1px solid #facc15",
                padding: 18,
                color: "#e5e7eb",
              }}
            >
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#facc15",
                  marginBottom: 4,
                }}
              >
                Quick ROI snapshot
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: "#e5e7eb",
                  marginBottom: 10,
                }}
              >
                A high-level estimate of your annual people risk (turnover +
                absence) compared with what you're currently investing in your
                people.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                  marginTop: 6,
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
                    marginTop: 10,
                    fontSize: 12,
                    color: "#e5e7eb",
                  }}
                >
                  In simple terms: for every £1 you invest in wellbeing, you're
                  currently carrying around{" "}
                  {roiSummary.roi_multiplier.toFixed(1)}x that amount in annual
                  people risk. Human Return Index™ exists to close that gap.
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      {/* LATEST PULSE SECTION */}
      <section
        style={{
          marginTop: 24,
          background: "#020617",
          borderRadius: 16,
          border: "1px solid #1f2937",
          padding: 18,
          color: "#e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 10,
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#f9fafb",
                marginBottom: 2,
              }}
            >
              Latest employee pulse
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ca3af",
                maxWidth: 520,
              }}
            >
              Live sentiment across the five HRI pillars, compared with your
              internal assessment. Pulse scores are shown on a 0–100 scale.
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#9ca3af",
              }}
            >
              Overall pulse score
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f9fafb",
                marginTop: 4,
              }}
            >
              {overallPulseScore != null ? overallPulseScore : "–"}
              <span style={{ fontSize: 14, opacity: 0.7 }}> / 100</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#9ca3af",
                marginTop: 3,
              }}
            >
              Average across the latest pulse responses by pillar.
            </div>
          </div>
        </div>

        {pulseItems.length === 0 ? (
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
            No pulse responses yet. Once employees complete a pulse, you'll see
            a live comparison here.
          </p>
        ) : (
          <div
            style={{
              marginTop: 10,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
              gap: 10,
            }}
          >
            {pulseItems.map((item) => (
              <PulseCard
                key={item.pillar}
                pillar={item.pillar}
                score={item.score100}
                assessmentScore={item.assessmentScore}
                diff={item.diff}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/** SMALL REUSABLE CARDS **/
function MetricCard({ label, value }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #111827",
        padding: 10,
        background:
          "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#f9fafb",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function PillarCard({ pillar, score }) {
  const value = Number(score);
  const safeScore = Number.isFinite(value) ? Math.round(value) : null;

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #111827",
        padding: 10,
        background:
          "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: 4,
        }}
      >
        {pillar}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#f9fafb",
        }}
      >
        {safeScore != null ? safeScore : "–"}
      </div>
    </div>
  );
}

function PulseCard({ pillar, score, assessmentScore, diff }) {
  const pulseScore = Number.isFinite(Number(score))
    ? Math.round(Number(score))
    : null;
  const assessment = Number.isFinite(Number(assessmentScore))
    ? Math.round(Number(assessmentScore))
    : null;

  let diffLabel = "";
  let diffSymbol = "";
  let diffColour = "#9ca3af";

  if (diff != null && assessment != null) {
    if (diff > 0) {
      diffSymbol = "▲";
      diffLabel = `${Math.abs(Math.round(diff))} higher than assessment`;
      diffColour = "#22c55e";
    } else if (diff < 0) {
      diffSymbol = "▼";
      diffLabel = `${Math.abs(Math.round(diff))} lower than assessment`;
      diffColour = "#f97316";
    } else {
      diffLabel = "In line with assessment";
      diffColour = "#9ca3af";
    }
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: "1px solid #111827",
        padding: 10,
        background:
          "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: 4,
        }}
      >
        {pillar}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#f9fafb",
          marginBottom: 4,
        }}
      >
        {pulseScore != null ? pulseScore : "–"}
        <span style={{ fontSize: 13, opacity: 0.7 }}> / 100</span>
      </div>
      {assessment != null && (
        <div
          style={{
            fontSize: 12,
            color: "#e5e7eb",
            marginBottom: 2,
          }}
        >
          Internal assessment:{" "}
          <span style={{ fontWeight: 600 }}>{assessment}</span>
        </div>
      )}
      {diff != null && assessment != null && (
        <div
          style={{
            fontSize: 12,
            color: diffColour,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span>{diffSymbol}</span>
          <span>{diffLabel}</span>
        </div>
      )}
    </div>
  );
}
