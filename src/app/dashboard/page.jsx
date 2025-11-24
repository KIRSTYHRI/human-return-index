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
          throw new Error(j.error || "Error loading dashboard data");
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
        <h1>Human Return Index™ Dashboard</h1>
        <p>Something went wrong:</p>
        <pre>{error}</pre>
      </main>
    );
  }

  if (!overview) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Human Return Index™ Dashboard</h1>
        <p>Loading live HRI data…</p>
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
        Human Return Index™ Dashboard
      </h1>
      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        Real-time view of how your people are doing — and what that means for
        performance, risk and ROI.
      </p>

      {/* ===================== */}
      {/* LATEST ASSESSMENT     */}
      {/* ===================== */}

      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Latest Assessment
        </h2>

        <div style={{ fontWeight: 600 }}>{overview.title}</div>
        <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 8 }}>
          Status: {overview.status} • Period: {overview.period_start} →{" "}
          {overview.period_end}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 12,
          }}
        >
          <div>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Overall HRI Score</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>
              {Math.round(overview.overall_score)}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
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

      {/* ===================== */}
      {/* PILLAR SCORES          */}
      {/* ===================== */}

      <section style={{ marginBottom: 24 }}>
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
            <PillarCard key={s.pillar} pillar={s.pillar} score={s.score} />
          ))}
        </div>
      </section>

      {/* ===================== */}
      {/* ORG METRICS           */}
      {/* ===================== */}

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
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          <MetricCard
            label="Organisation"
            value={
              orgMetrics?.name && orgMetrics.name.trim() !== ""
                ? orgMetrics.name
                : "Your organisation"
            }
          />
          <MetricCard
            label="Employees"
            value={orgMetrics?.employee_count ?? "–"}
          />
          <MetricCard
            label="Average salary"
            value={
              orgMetrics?.avg_salary
                ? `£${orgMetrics.avg_salary.toLocaleString()}`
                : "–"
            }
          />
          <MetricCard
            label="Turnover rate"
            value={
              orgMetrics?.turnover_rate
                ? `${orgMetrics.turnover_rate}%`
                : "–"
            }
          />
          <MetricCard
            label="Absence days per employee"
            value={orgMetrics?.absent_days_per_employee ?? "–"}
          />
          <MetricCard
            label="Annual wellbeing spend"
            value={
              orgMetrics?.annual_wellbeing_spend
                ? `£${orgMetrics.annual_wellbeing_spend.toLocaleString()}`
                : "–"
            }
          />
          <MetricCard
            label="Engagement score"
            value={
              orgMetrics?.engagement_score
                ? `${orgMetrics.engagement_score}/100`
                : "–"
            }
          />
        </div>
      </section>

      {/* ===================== */}
      {/* ROI SNAPSHOT          */}
      {/* ===================== */}

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
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Quick ROI snapshot
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 12,
            }}
          >
            <MetricCard
              label="Total payroll"
              value={`£${roiSummary.total_payroll.toLocaleString("en-GB")}`}
            />
            <MetricCard
              label="Estimated turnover cost / year"
              value={`£${roiSummary.estimated_turnover_cost.toLocaleString(
                "en-GB"
              )}`}
            />
            <MetricCard
              label="Estimated absence cost / year"
              value={`£${roiSummary.estimated_absence_cost.toLocaleString(
                "en-GB"
              )}`}
            />
            <MetricCard
              label="Total people risk / year"
              value={`£${roiSummary.total_people_risk.toLocaleString(
                "en-GB"
              )}`}
            />
            <MetricCard
              label="Wellbeing investment / year"
              value={`£${roiSummary.annual_wellbeing_spend.toLocaleString(
                "en-GB"
              )}`}
            />
            <MetricCard
              label="People risk : wellbeing ratio"
              value={`${roiSummary.roi_multiplier.toFixed(1)}x`}
            />
          </div>
        </section>
      )}

      {/* ===================== */}
      {/* EMPLOYEE PULSE        */}
      {/* ===================== */}

      {pulseSummary && pulseSummary.length > 0 && (
        <section
          style={{
            border: "1px solid #e8f0ff",
            background: "#f7faff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Latest Employee Pulse
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 12,
            }}
          >
            {pulseSummary.map((p) => (
              <PillarCard
                key={p.pillar}
                pillar={p.pillar}
                score={Math.round(p.score * 20)}
                isPulse
                assessmentScore={
                  scores.find((s) => s.pillar === p.pillar)?.score
                }
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function PillarCard({ pillar, score, isPulse, assessmentScore }) {
  return (
    <div
      style={{
        border: "1px solid #eee",
        borderRadius: 10,
        padding: 12,
        background: "white",
      }}
    >
      <div style={{ opacity: 0.7, fontSize: 12 }}>{pillar}</div>
      <div style={{ fontSize: 24, fontWeight: 800 }}>{Math.round(score)}</div>
      {isPulse && assessmentScore != null && (
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.8 }}>
          Internal assessment: <strong>{assessmentScore}</strong>
        </div>
      )}
    </div>
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
