"use client";

import { useEffect, useState } from "react";

function formatMoney(value) {
  if (value == null) return "–";
  return `£${Number(value).toLocaleString("en-GB")}`;
}

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

        if (!json.ok) {
          throw new Error(json.error || "Failed to load dashboard data");
        }

        setOverview(json.overview || null);
        setScores(json.scores || []);
        setOrgMetrics(json.org_metrics || null);
        setRoiSummary(json.roi_summary || null);
        setPulseSummary(json.pulse_summary || null);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Unexpected error loading dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overallPulse =
    pulseSummary && pulseSummary.length
      ? pulseSummary.reduce((sum, p) => sum + p.score, 0) / pulseSummary.length
      : null;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        color: "#0f172a", // 🔥 DARK TEXT EVERYWHERE
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* TOP BAR WITH LOGO */}
      <header
        style={{
          borderBottom: "1px solid #e5e7eb",
          background: "#020617",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* 👇 Update this src to your real logo file in /public */}
            <img
              src="/hri-logo-yellow.svg"
              alt="Human Return Index logo"
              style={{ height: 32 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#e5e7eb",
                  opacity: 0.8,
                }}
              >
                Human Return Index™
              </span>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                People-first KPI for modern organisations
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              color: "#e5e7eb",
              background: "rgba(15,23,42,0.8)",
            }}
          >
            LIVE PILOT ENVIRONMENT · INTERNAL USE
          </span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: 24,
        }}
      >
        {/* PAGE HEADER */}
        <section style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              marginBottom: 6,
              color: "#020617",
            }}
          >
            Human Return Index™ Dashboard
          </h1>
          <p style={{ fontSize: 13, opacity: 0.8, maxWidth: 640 }}>
            Real-time view of how your people are doing – and what that means
            for performance, risk and ROI.
          </p>
        </section>

        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading your latest HRI data…</p>
        ) : error ? (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: "#fef2f2",
              color: "#7f1d1d",
              border: "1px solid #fecaca",
              fontSize: 13,
            }}
          >
            <strong>Something went wrong loading your data:</strong>
            <br />
            <span>{error}</span>
          </div>
        ) : !overview ? (
          <p style={{ opacity: 0.7 }}>
            No assessment found yet. Once your first HRI assessment is created,
            it will appear here.
          </p>
        ) : (
          <>
            {/* ====== LATEST ASSESSMENT STRIP ====== */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.2fr)",
                gap: 16,
                marginBottom: 20,
                alignItems: "stretch",
              }}
            >
              {/* Assessment info */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "#6b7280",
                    marginBottom: 6,
                  }}
                >
                  Latest Assessment
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  {overview.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#4b5563",
                    marginBottom: 2,
                  }}
                >
                  Status:{" "}
                  <strong style={{ color: "#111827" }}>
                    {overview.status}
                  </strong>{" "}
                  · Period: {overview.period_start} → {overview.period_end}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Created:{" "}
                  {overview.assessment_created_at
                    ? new Date(
                        overview.assessment_created_at
                      ).toLocaleDateString("en-GB")
                    : "-"}
                </div>
              </div>

              {/* Overall score + badge */}
              <div
                style={{
                  background: "#020617",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.45)",
                  padding: 16,
                  color: "#e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#9ca3af",
                        marginBottom: 4,
                      }}
                    >
                      Overall HRI Score
                    </div>
                    <div
                      style={{
                        fontSize: 34,
                        fontWeight: 800,
                        color: "#FEE000",
                      }}
                    >
                      {overview.overall_score != null
                        ? Math.round(overview.overall_score)
                        : "–"}
                      <span
                        style={{
                          fontSize: 18,
                          marginLeft: 4,
                          color: "#e5e7eb",
                          opacity: 0.7,
                        }}
                      >
                        / 100
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#9ca3af",
                        marginBottom: 2,
                      }}
                    >
                      Badge
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                      {overview.badge_level || "No badge yet"}
                    </div>
                    {overview.badge_awarded_at && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 2,
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

            {/* ====== PILLAR SCORES + ORG METRICS ====== */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.6fr)",
                gap: 18,
                marginBottom: 22,
              }}
            >
              {/* Pillar scores */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Pillar scores (internal assessment)
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 10,
                  }}
                >
                  Average scores across your five HRI pillars, all normalised to
                  a 0–100 scale.
                </p>

                {scores && scores.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {scores.map((s) => (
                      <div
                        key={s.pillar}
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: "#4b5563",
                            marginBottom: 4,
                          }}
                        >
                          {s.pillar}
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#111827",
                          }}
                        >
                          {Math.round(Number(s.score))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#6b7280" }}>
                    No pillar scores available yet.
                  </p>
                )}
              </div>

              {/* Org metrics */}
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Organisation metrics
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginBottom: 10,
                  }}
                >
                  Core people and cost inputs used to model your HRI score and
                  people risk.
                </p>

                {orgMetrics ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <MetricCard
                      label="Organisation"
                      value={
                        orgMetrics.name ||
                        "Your organisation"
                      }
                    />
                    <MetricCard
                      label="Employees"
                      value={
                        orgMetrics.employee_count != null
                          ? orgMetrics.employee_count.toLocaleString("en-GB")
                          : "–"
                      }
                    />
                    <MetricCard
                      label="Average salary"
                      value={formatMoney(orgMetrics.avg_salary)}
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
                      value={formatMoney(orgMetrics.annual_wellbeing_spend)}
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
                  <p style={{ fontSize: 12, color: "#6b7280" }}>
                    No organisation metrics set yet. Update them on the
                    Settings page.
                  </p>
                )}
              </div>
            </section>

            {/* ====== ROI SNAPSHOT ====== */}
            {roiSummary && (
              <section
                style={{
                  background: "#020617",
                  borderRadius: 14,
                  border: "1px solid rgba(148,163,184,0.4)",
                  padding: 18,
                  marginBottom: 22,
                  color: "#e5e7eb",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  Quick ROI snapshot
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#cbd5f5",
                    marginBottom: 12,
                    maxWidth: 720,
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
                      "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    marginBottom: 10,
                  }}
                >
                  <DarkMetric label="Total payroll" value={formatMoney(roiSummary.total_payroll)} />
                  <DarkMetric
                    label="Estimated turnover cost / year"
                    value={formatMoney(roiSummary.estimated_turnover_cost)}
                  />
                  <DarkMetric
                    label="Estimated absence cost / year"
                    value={formatMoney(roiSummary.estimated_absence_cost)}
                  />
                  <DarkMetric
                    label="Total people risk / year"
                    value={formatMoney(roiSummary.total_people_risk)}
                  />
                  <DarkMetric
                    label="Wellbeing investment / year"
                    value={formatMoney(roiSummary.annual_wellbeing_spend)}
                  />
                  <DarkMetric
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
                      color: "#e5e7eb",
                      maxWidth: 720,
                    }}
                  >
                    In simple terms: for every £1 you invest in wellbeing,
                    you're currently carrying around{" "}
                    {roiSummary.roi_multiplier.toFixed(1)}x that amount in
                    annual people risk. Human Return Index™ exists to close that
                    gap.
                  </p>
                )}
              </section>
            )}

            {/* ====== LATEST EMPLOYEE PULSE ====== */}
            <section
              style={{
                background: "#ffffff",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                padding: 16,
                marginBottom: 40,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    Latest employee pulse
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      maxWidth: 520,
                    }}
                  >
                    Live sentiment across the five HRI pillars, compared with
                    your internal assessment. Pulse scores are shown on a 0–100
                    scale.
                  </p>
                </div>

                {overallPulse != null && (
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "#6b7280",
                      }}
                    >
                      Overall pulse score
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {Math.round(overallPulse)}{" "}
                      <span
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                        }}
                      >
                        / 100
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      Average across the latest pulse responses by pillar.
                    </div>
                  </div>
                )}
              </div>

              {pulseSummary && pulseSummary.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 12,
                  }}
                >
                  {pulseSummary.map((p) => {
                    const matching = scores.find(
                      (s) => s.pillar === p.pillar
                    );
                    const assessmentScore = matching
                      ? Number(matching.score)
                      : null;
                    const diff =
                      assessmentScore != null ? p.score - assessmentScore : null;

                    const diffLabel =
                      diff == null
                        ? null
                        : diff > 0
                        ? `${Math.abs(Math.round(diff))} higher than assessment`
                        : diff < 0
                        ? `${Math.abs(Math.round(diff))} lower than assessment`
                        : "Matches assessment";

                    const diffSymbol =
                      diff == null ? "" : diff > 0 ? "▲" : diff < 0 ? "▼" : "•";

                    const diffColor =
                      diff == null
                        ? "#6b7280"
                        : diff > 0
                        ? "#16a34a"
                        : "#dc2626";

                    return (
                      <div
                        key={p.pillar}
                        style={{
                          padding: 14,
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            marginBottom: 6,
                            color: "#111827",
                          }}
                        >
                          {p.pillar}
                        </div>

                        <div
                          style={{
                            fontSize: 26,
                            fontWeight: 800,
                            color: "#111827",
                            marginBottom: 4,
                          }}
                        >
                          {Math.round(p.score)}
                        </div>

                        {assessmentScore != null && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "#4b5563",
                            }}
                          >
                            Internal assessment:{" "}
                            <strong>{assessmentScore}</strong>
                          </div>
                        )}

                        {diffLabel && (
                          <div
                            style={{
                              fontSize: 12,
                              marginTop: 6,
                              color: diffColor,
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
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#6b7280" }}>
                  No employee pulse responses yet. Once your first pulse is
                  collected, it will appear here.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "#6b7280",
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#111827",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: "1px solid rgba(148,163,184,0.5)",
        background: "rgba(15,23,42,0.9)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
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
          color: "#e5e7eb",
        }}
      >
        {value}
      </div>
    </div>
  );
}
