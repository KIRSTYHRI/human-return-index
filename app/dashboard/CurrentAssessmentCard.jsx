"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/apiFetch";

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isSessionMissing(res, data) {
  if (res?.status !== 401) return false;
  const msg = (data?.error || "").toLowerCase();
  return msg.includes("auth session missing");
}

export default function CurrentAssessmentCard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch("/api/overview");
        const data = await res.json();

        if (cancelled) return;

        if (isSessionMissing(res, data)) {
          setError(null);
          setOverview(data?.overview || data || {});
          return;
        }

        if (!res.ok) {
          setError(data?.error || "Failed to load overview");
          setOverview(null);
          return;
        }

        setOverview(data?.overview || data || null);
setError(null);

const metricsRes = await apiFetch("/api/org-metrics");
const metricsData = await metricsRes.json();

if (!metricsRes.ok) {
  throw new Error(metricsData?.error || "Failed to load org metrics");
}

setMetrics(metricsData?.metrics || metricsData || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hriScore = num(overview?.overall_score);
  const employerScore = num(overview?.employer_score);
  const employeeScore = num(overview?.employee_score);
  const previousScore = num(overview?.previous_score);
  const scoreChange = num(overview?.score_change);

  const scoreGap =
    employerScore != null && employeeScore != null
      ? Math.round((employerScore - employeeScore) * 10) / 10
      : null;

  const latest = overview?.latest_assessment || null;
  const badge = overview?.badge || null;
  const pillars = overview?.pillar_scores || null;

  const pillarList = pillars && typeof pillars === "object"
    ? Object.entries(pillars).map(([label, value]) => ({ label, value }))
    : [];

  return (
    <div className="card">
      <div className="cardTop">
        <h2 className="cardTitle">Human Return Index™ Dashboard</h2>
        <span className={`chip ${loading ? "chipMuted" : "chipLive"}`}>
          {loading ? "Loading…" : "LIVE PILOT"}
        </span>
      </div>

      <p className="pageSub" style={{ marginTop: 0 }}>
        Real-time view of how your people are doing — and what that means for performance, risk and ROI.
      </p>

      {error && <p className="errorText">{error}</p>}

      {!error && (
        <div className="dashGrid">
          <div className="panel">
            <div className="panelHeader">
              <div className="panelTitle">LATEST ASSESSMENT</div>
              <div className="panelMeta">{loading ? "—" : "Live"}</div>
            </div>

            <div className="bigRow">
              <div>
                <div className="bigTitle">{latest?.title || "HRI Assessment"}</div>
                <div className="mutedSmall">
                  Created: {formatDate(latest?.created_at)}
                </div>
              </div>

              <div className="scoreBox">
                <div className="scoreLabel">OVERALL HRI SCORE</div>
                <div className="scoreValue">
                  {hriScore ?? "—"}
                  <span className="scoreOutOf">/100</span>
                </div>

                <div className="scoreLabel" style={{ marginTop: 10 }}>BADGE</div>
                <div className="badgePill">{badge || "No badge yet"}</div>
              </div>
            </div>

            <div className="panelDivider" />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div className="pillBox">
                <div className="pillLabel">Employer Score</div>
                <div className="pillValue">{employerScore ?? "—"}</div>
              </div>

              <div className="pillBox">
                <div className="pillLabel">Employee Score</div>
                <div className="pillValue">{employeeScore ?? "—"}</div>
              </div>

              <div className="pillBox">
                <div className="pillLabel">HRI Score</div>
                <div className="pillValue">{hriScore ?? "—"}</div>
              </div>

              <div className="pillBox">
                <div className="pillLabel">Badge</div>
                <div className="pillValue" style={{ fontSize: 16 }}>
                  {badge ?? "—"}
                </div>
              </div>
            </div>

            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.03)",
              }}
            >
              <div className="pillLabel" style={{ marginBottom: 6 }}>HRI Insight</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {scoreGap == null
                  ? "Not enough data yet to compare employer and employee scores."
                  : scoreGap === 0
                    ? "Employer and employee scores are aligned."
                    : scoreGap > 0
                      ? `Employer score is ${scoreGap} points higher than employee score.`
                      : `Employee score is ${Math.abs(scoreGap)} points higher than employer score.`}
              </div>
              <div className="mutedSmall" style={{ marginTop: 6 }}>
                This shows whether leadership perception and employee experience are aligned.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div className="pillBox">
                <div className="pillLabel">Previous HRI</div>
                <div className="pillValue">{previousScore ?? "—"}</div>
              </div>

              <div className="pillBox">
                <div className="pillLabel">Change</div>
                <div className="pillValue">
                  {scoreChange == null ? "—" : scoreChange > 0 ? `+${scoreChange}` : scoreChange}
                </div>
              </div>
            </div>

            <div className="panelTitle" style={{ marginBottom: 10 }}>
              Blended pillar scores
            </div>

            <div className="pillarsGrid">
              {pillarList.map((p, idx) => (
                <div className="pillBox" key={idx}>
                  <div className="pillLabel">{p.label}</div>
                  <div className="pillValue">{num(p.value) ?? "—"}</div>
                </div>
              ))}
            </div>

            <div className="panelDivider" />

            <div className="panelTitle" style={{ marginBottom: 10 }}>
              Estimated financial impact
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <div className="pillBox">
                <div className="pillLabel">Retention risk</div>
                <div className="pillValue">
                  {hriScore == null ? "—" : hriScore >= 80 ? "Low" : hriScore >= 65 ? "Moderate" : "High"}
                </div>
              </div>

              <div className="pillBox">
                <div className="pillLabel">Productivity opportunity</div>
                <div className="pillValue">
                  {hriScore == null ? "—" : hriScore >= 80 ? "Strong" : hriScore >= 65 ? "Medium" : "High urgency"}
                </div>
              </div>

              <div className="pillBox">
                <div className="pillLabel">Estimated ROI signal</div>
                <div className="pillValue">
                  {hriScore == null ? "—" : hriScore >= 80 ? "Positive" : hriScore >= 65 ? "Recoverable" : "At risk"}
                </div>
              </div>
            </div>

            <div className="linkRow">
              <Link className="linkChip" href="/dashboard/hri-assessment">Internal Assessment</Link>
              <Link className="linkChip" href="/dashboard/employee-pulse">Employee Pulse</Link>
              <Link className="linkChip" href="/dashboard/scores">Scores</Link>
            </div>
          </div>

          <OrgMetricsCard />
        </div>
      )}
    </div>
  );
}

function OrgMetricsCard() {
const [loading, setLoading] = useState(true);
const [overview, setOverview] = useState(null);
const [metrics, setMetrics] = useState(null);
const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch("/api/org-metrics");
        const data = await res.json();

        if (cancelled) return;

        if (isSessionMissing(res, data)) {
          setError(null);
          setMetrics(data?.metrics || data || {});
          return;
        }

        if (!res.ok) {
          setError(data?.error || "Failed to load org metrics");
          setMetrics(null);
          return;
        }

        setMetrics(data?.metrics || data || null);
        setError(null);
      } catch (e) {
        if (!cancelled) return;
        setError(e?.message || "Failed to load org metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const items = [
    { k: "Organisation", v: metrics?.organisation_name || "Your organisation" },
    { k: "Employees", v: metrics?.employees ?? "—" },
    {
      k: "Average salary",
      v: metrics?.avg_salary ? `£${Number(metrics.avg_salary).toLocaleString()}` : "—",
    },
    {
      k: "Turnover rate",
      v: metrics?.turnover_rate ? `${metrics.turnover_rate}%` : "—",
    },
    {
      k: "Absence days / employee",
      v: metrics?.absence_days ?? "—",
    },
    {
      k: "Annual wellbeing spend",
      v: metrics?.wellbeing_spend ? `£${Number(metrics.wellbeing_spend).toLocaleString()}` : "—",
    },
    {
      k: "Engagement score",
      v: metrics?.engagement_score ? `${metrics.engagement_score}/100` : "—",
    },
  ];

  return (
    <div className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Organisation metrics</div>
        <div className="panelMeta">{loading ? "Loading…" : "Core inputs"}</div>
      </div>

      <p className="mutedSmall" style={{ marginTop: 8 }}>
        Core people and cost inputs used to model your HRI score and people risk.
      </p>

      {error && <p className="errorText">{error}</p>}

      <div className="metricsGrid">
        {items.map((it, i) => (
          <div className="metric" key={i}>
            <div className="metricK">{it.k}</div>
            <div className="metricV">{it.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
