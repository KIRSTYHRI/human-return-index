"use client";

import { useEffect, useState } from "react";

export default function Dashboard() {
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
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Human Return Index™ Dashboard
        </h1>
        <p style={{ marginBottom: 16, opacity: 0.8 }}>
          Something went wrong loading your data:
        </p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 13,
            padding: 12,
            borderRadius: 8,
            background: "#ffe6e6",
            color: "#7a0000",
            border: "1px solid #f5b5b5",
          }}
        >
          {error}
        </pre>
      </main>
    );
  }

  if (loading || !overview) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Human Return Index™ Dashboard
        </h1>
        <p style={{ opacity: 0.8 }}>Loading your latest HRI data…</p>
      </main>
    );
  }

  const orgName = orgMetrics?.name || "Your organisation";

  // Build quick lookup for internal pillar scores (0–100)
  const assessmentScoreByPillar = new Map();
  for (const s of scores) {
    if (s?.pillar != null && s?.score != null) {
      assessmentScoreByPillar.set(s.pillar, Number(s.score));
    }
  }

  // Compute overall pulse score (0–100) from 1–5 averages
  let overallPulseScore = null;
  let pulsePillars = [];

  if (Array.isArray(pulseSummary) && pulseSummary.length > 0) {
    pulsePillars = pulseSummary.map((p) => {
      const rawValue = Number(p.score); // 1–5
      const pulseScore100 = Number.isFinite(rawValue) ? rawValue * 20 : null;
      const assessmentScore = assessmentScoreByPillar.get(p.pillar) ?? null;
      const diff =
        pulseScore100 != null && assessmentScore != null
          ? pulseScore100 - assessmentScore
          : null;

      return {
        pillar: p.pillar,
        pulseScore100,
        assessmentScore,
        diff,
      };
    });

    const validPulseScores = pulsePillars
      .map((p) => p.pulseScore100)
      .filter((v) => v != null);

    if (validPulseScores.length > 0) {
      overallPulseScore =
        validPulseScores.reduce((sum, v) => sum + v, 0) /
        validPulseScores.length;
    }
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 1040,
        margin: "0 auto",
      }}
    >
      {/* HEADER */}
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          Human Return Index™ Dashboard
        </h1>
        <p style={{ opacity: 0.75, fontSize: 14 }}>
          Real-time view of how your people are doing – and what that means for
          performance, risk and ROI.
        </p>
        <p
          style={{
            marginTop: 6,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.08,
            opacity: 0.6,
          }}
        >
          Live pilot environment · internal use
        </p>
      </header>

      {/* LATEST ASSESSMENT SUMMARY */}
      <Section title="Latest Assessment">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.7,
                textTransform: "uppercase",
                letterSpacing: 0.08,
                marginBottom: 4,
              }}
            >
              Assessment
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {overview.title}
            </div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>
              Status: {overview.status} · Period: {overview.period_start} →{" "}
              {overview.period_end}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Created:{" "}
              {overview.assessment_created_at
                ? new Date(
                    overview.assessment_created_at
                  ).toLocaleDateString("en-GB")
                : "-"}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  marginBottom: 4,
                }}
              >
                Overall HRI score
              </div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>
                {overview.overall_score != null
                  ? `${Math.round(overview.overall_score)} / 100`
                  : "–"}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  marginBottom: 4,
                }}
              >
                Badge
              </div>
              <div style={{ fontWeight: 700 }}>
                {overview.badge_level || "No badge yet"}
              </div>
              {overview.badge_awarded_at && (
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                  Awarded:{" "}
                  {new Date(
                    overview.badge_awarded_at
                  ).toLocaleDateString("en-GB")}
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* PILLAR SCORES */}
      <Section title="Pillar scores (internal assessment)">
        <p
          style={{
            fontSize: 13,
            opacity: 0.75,
            marginBottom: 16,
          }}
        >
          Average scores across your five HRI pillars, all normalised to a
          0–100 scale.
        </p>
        {scores.length === 0 ? (
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            No pillar scores yet. Complete an assessment to see your HRI pillar
            breakdown.
          </p>
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
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 14,
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.7,
                    marginBottom: 4,
                  }}
                >
                  {s.pillar}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>
                  {Math.round(Number(s.score))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ORG METRICS */}
      <Section title="Organisation metrics">
        <p
          style={{
            fontSize: 13,
            opacity: 0.75,
            marginBottom: 16,
          }}
        >
          Core people and cost inputs used to model your HRI score and people
          risk.
        </p>

        {!orgMetrics ? (
          <p style={{ fontSize: 13, opacity: 0.7 }}>
            No organisation metrics found yet. Update your figures in the
            Organisation inputs page.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
            }}
          >
            <MetricCard label="Organisation" value={orgName} />
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
        )}
      </Section>

      {/* QUICK ROI SNAPSHOT */}
      {roiSummary && (
        <Section title="Quick ROI snapshot">
          <p
            style={{
              fontSize: 13,
              opacity: 0.75,
              marginBottom: 16,
            }}
          >
            A high-level estimate of your annual people risk (turnover + absence)
            compared with what you're currently investing in your people.
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
                marginTop: 14,
                fontSize: 13,
                opacity: 0.8,
              }}
            >
              In simple terms: for every £1 you invest in wellbeing, you're
              currently carrying around{" "}
              {roiSummary.roi_multiplier.toFixed(1)}x that in people risk
              (turnover + absence). Human Return Index™ exists to close that
              gap.
            </p>
          )}
        </Section>
      )}

      {/* LATEST EMPLOYEE PULSE */}
      {pulsePillars.length > 0 && (
        <Section title="Latest employee pulse">
          <p
            style={{
              fontSize: 13,
              opacity: 0.75,
              marginBottom: 16,
            }}
          >
            Live sentiment across the five HRI pillars, compared with your
            internal assessment. Pulse scores are shown on a 0–100 scale.
          </p>

          {overallPulseScore != null && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 10,
                background: "#f5f7ff",
                border: "1px solid #e0e4ff",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  marginBottom: 4,
                }}
              >
                Overall pulse score
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {Math.round(overallPulseScore)} / 100
              </div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Average across the latest pulse responses by pillar.
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {pulsePillars.map((p) => (
              <PulsePillarCard key={p.pillar} {...p} />
            ))}
          </div>
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
        background: "#ffffff",
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MetricCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        padding: 16,
        borderRadius: 12,
        background: "#fafafa",
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.65 }}>{label}</div>
      <div style={{ fontWeight: 700, marginTop: 6, fontSize: 16 }}>
        {value}
      </div>
    </div>
  );
}

function PulsePillarCard({ pillar, pulseScore100, assessmentScore, diff }) {
  const hasComparison =
    pulseScore100 != null && assessmentScore != null && diff != null;

  let trendLabel = "";
  let trendSymbol = "";
  let trendColour = "#555";

  if (hasComparison) {
    if (diff > 0) {
      trendLabel = `${Math.abs(Math.round(diff))} higher than assessment`;
      trendSymbol = "▲";
      trendColour = "#0b7a34";
    } else if (diff < 0) {
      trendLabel = `${Math.abs(Math.round(diff))} lower than assessment`;
      trendSymbol = "▼";
      trendColour = "#b00020";
    } else {
      trendLabel = "Matches internal assessment";
      trendSymbol = "•";
      trendColour = "#555";
    }
  }

  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 12,
        padding: 16,
        background: "#fafafa",
      }}
    >
      <div
        style={{
          fontSize: 12,
          opacity: 0.7,
          marginBottom: 4,
        }}
      >
        {pillar}
      </div>

      <div style={{ fontSize: 20, fontWeight: 700 }}>
        {pulseScore100 != null ? Math.round(pulseScore100) : "–"}
      </div>
      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
        Pulse score (0–100)
      </div>

      {hasComparison && (
        <>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Internal assessment: <strong>{Math.round(assessmentScore)}</strong>
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              color: trendColour,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>{trendSymbol}</span>
            <span>{trendLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}
