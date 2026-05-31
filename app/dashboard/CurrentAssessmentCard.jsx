"use client";

import { useEffect, useMemo, useState } from "react";
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

function formatDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function formatCurrency(value) {
  const n = num(value);
  if (n == null) return "—";
  return `£${Math.round(n).toLocaleString()}`;
}

function getTrendLabel(scoreChange) {
  const n = num(scoreChange);
  if (n == null) return "No trend yet";
  if (n > 0) return "Improving";
  if (n < 0) return "Declining";
  return "Unchanged";
}

function getTrendTone(scoreChange) {
  const n = num(scoreChange);

  if (n == null) {
    return {
      bg: "rgba(255,255,255,.05)",
      border: "rgba(255,255,255,.10)",
      text: "#fff",
    };
  }

  if (n > 0) {
    return {
      bg: "rgba(34,197,94,.12)",
      border: "rgba(34,197,94,.35)",
      text: "#86efac",
    };
  }

  if (n < 0) {
    return {
      bg: "rgba(239,68,68,.12)",
      border: "rgba(239,68,68,.35)",
      text: "#fca5a5",
    };
  }

  return {
    bg: "rgba(255,255,255,.05)",
    border: "rgba(255,255,255,.10)",
    text: "#fff",
  };
}

function getWhatThisMeans(hriScore) {
  const score = num(hriScore);

  if (score == null) {
    return "Your HRI score will appear once both employer and employee data are available.";
  }

  if (score >= 80) {
    return "Strong performing organisation with lower people risk and stronger potential for sustainable performance.";
  }

  if (score >= 65) {
    return "Moderate performance with clear opportunities to improve productivity, retention and workforce experience.";
  }

  return "Higher people risk zone — likely impact on productivity, retention, trust and absence-related cost.";
}

export default function CurrentAssessmentCard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const res = await apiFetch("/api/overview", { cache: "no-store" });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setError(data?.error || "Failed to load overview");
          setOverview(null);
          setMetrics(null);
          return;
        }

        setOverview(data?.overview || data || null);
        setError(null);

        const metricsRes = await apiFetch("/api/org-metrics", { cache: "no-store" });
        const metricsData = await metricsRes.json();

        if (cancelled) return;

        if (!metricsRes.ok) {
          throw new Error(metricsData?.error || "Failed to load org metrics");
        }

        setMetrics(metricsData?.metrics || metricsData || null);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load dashboard");
          setOverview(null);
          setMetrics(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const hriScore = num(overview?.overall_score);
  const employerScore = num(overview?.employer_score);
  const employeeScore = num(overview?.employee_score);
  const previousScore = num(overview?.previous_score);
  const scoreChange = num(overview?.score_change);
  const updatedAt = overview?.updated_at || null;

  const scoreGap =
    employerScore != null && employeeScore != null
      ? Math.round((employerScore - employeeScore) * 10) / 10
      : null;

  const latest = overview?.latest_assessment || null;
  const badge = overview?.badge || null;
  const pillars = overview?.pillar_scores || null;

  const pillarList =
    pillars && typeof pillars === "object"
      ? Object.entries(pillars).map(([label, value]) => ({
          label,
          value: num(value),
        }))
      : [];

  const weakestPillar = useMemo(() => {
    if (!pillarList.length) return null;
    return [...pillarList]
      .filter((p) => p.value != null)
      .sort((a, b) => a.value - b.value)[0] || null;
  }, [pillarList]);

  const strongestPillar = useMemo(() => {
    if (!pillarList.length) return null;
    return [...pillarList]
      .filter((p) => p.value != null)
      .sort((a, b) => b.value - a.value)[0] || null;
  }, [pillarList]);

  const actionPriorities = weakestPillar?.label
    ? [
        `Focus first on ${weakestPillar.label}, as this is currently your lowest scoring area.`,
        "Review leadership communication, listening channels and employee feedback loops.",
        "Use the next employee pulse to track whether action is improving the HRI score.",
      ]
    : [
        "Complete both employer and employee assessments to unlock recommended priorities.",
      ];

  const employees = num(metrics?.employee_count);
  const avgSalary = num(metrics?.avg_salary);
  const absenceDaysPerEmployee = num(metrics?.absent_days_per_employee);
  const turnoverRatePercent = num(metrics?.turnover_rate);
  const hriScoreInput = hriScore;

  const REPLACEMENT_COST_RATE = 0.3;
  const WORKING_DAYS = 260;
  const RECOVERY_FACTOR = 0.5;

  const turnoverRateDecimal =
    turnoverRatePercent != null ? turnoverRatePercent / 100 : null;

  const turnoverCost =
    employees != null &&
    avgSalary != null &&
    turnoverRateDecimal != null &&
    hriScoreInput != null
      ? Math.round(employees * turnoverRateDecimal * avgSalary * REPLACEMENT_COST_RATE)
      : null;

  const absenceCost =
    employees != null &&
    avgSalary != null &&
    absenceDaysPerEmployee != null &&
    hriScoreInput != null
      ? Math.round(employees * absenceDaysPerEmployee * (avgSalary / WORKING_DAYS))
      : null;

  const performanceGapPercent =
    hriScoreInput != null ? 100 - hriScoreInput : null;

  const recoverableGapPercent =
    performanceGapPercent != null
      ? (performanceGapPercent / 100) * RECOVERY_FACTOR
      : null;

  const productivityOpportunity =
    employees != null &&
    avgSalary != null &&
    recoverableGapPercent != null
      ? Math.round(employees * avgSalary * recoverableGapPercent)
      : null;

  const totalValueAtStake =
    turnoverCost != null &&
    absenceCost != null &&
    productivityOpportunity != null
      ? Math.round(turnoverCost + absenceCost + productivityOpportunity)
      : null;

  const trendLabel = getTrendLabel(scoreChange);
  const trendTone = getTrendTone(scoreChange);

  const hriInsightText =
    scoreGap == null
      ? "Not enough data yet to compare employer and employee scores."
      : scoreGap === 0
        ? "Employer and employee scores are aligned, which suggests leadership perception and employee experience are currently in step."
        : scoreGap > 0
          ? `Employer score is ${scoreGap} points higher than employee score, which suggests leadership perception is stronger than lived employee experience.`
          : `Employee score is ${Math.abs(scoreGap)} points higher than employer score, which suggests employees may be experiencing the organisation more positively than leadership assumes.`;

  const boardSummary =
    weakestPillar?.label && strongestPillar?.label
      ? `Your biggest pressure point currently sits in ${weakestPillar.label}, while your strongest area is ${strongestPillar.label}.`
      : "Complete both assessments to unlock a clearer board-level picture of people performance.";

  return (
    <div className="card">
      <div className="cardTop">
        <h2 className="cardTitle">Human Return Index™ Dashboard</h2>
        <span className={`chip ${loading ? "chipMuted" : "chipLive"}`}>
          {loading ? "Loading…" : "LIVE"}
        </span>
      </div>

      <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 16,
  }}
>
  <button
    onClick={() => window.print()}
    className="linkChip"
    style={{
      cursor: "pointer",
      border: "1px solid rgba(255,255,255,.15)",
      background: "rgba(254,224,0,.12)",
      color: "inherit",
    }}
  >
    Download Executive Report
  </button>
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
                <div className="mutedSmall">Created: {formatDate(latest?.created_at)}</div>
                <div className="mutedSmall">Last updated: {formatDateTime(updatedAt)}</div>
              </div>

              <div className="scoreBox">
                <div className="scoreLabel">OVERALL HRI SCORE</div>
                <div className="scoreValue">
                  {hriScore ?? "—"}
                  <span className="scoreOutOf">/100</span>
                </div>

                <div className="scoreLabel" style={{ marginTop: 10 }}>
                  BADGE
                </div>
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

            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 12,
                border: `1px solid ${trendTone.border}`,
                background: trendTone.bg,
              }}
            >
              <div className="pillLabel" style={{ marginBottom: 6 }}>
                HRI Trend
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: trendTone.text }}>
                {trendLabel}
              </div>
              <div className="mutedSmall" style={{ marginTop: 6 }}>
                {scoreChange == null
                  ? "A second score point is needed before movement can be measured."
                  : scoreChange > 0
                    ? `Your HRI score has increased by ${scoreChange} points since the previous score.`
                    : scoreChange < 0
                      ? `Your HRI score has decreased by ${Math.abs(scoreChange)} points since the previous score.`
                      : "Your HRI score is unchanged since the previous score."}
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
              <div className="pillLabel" style={{ marginBottom: 6 }}>
                What this means
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {getWhatThisMeans(hriScore)}
              </div>
              <div className="mutedSmall" style={{ marginTop: 6 }}>
                HRI measures the gap between employee experience and leadership perception — and its impact on performance.
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
              <div className="pillLabel" style={{ marginBottom: 6 }}>
                HRI Insight
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{hriInsightText}</div>
              <div className="mutedSmall" style={{ marginTop: 6 }}>{boardSummary}</div>
            </div>

            <div
              style={{
                marginBottom: 16,
                padding: 14,
                borderRadius: 12,
                border: "1px solid rgba(254,224,0,.25)",
                background: "rgba(254,224,0,.06)",
              }}
            >
              <div className="pillLabel" style={{ marginBottom: 8 }}>
                Recommended Priorities
              </div>

              <ol style={{ margin: 0, paddingLeft: 18 }}>
                {actionPriorities.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: 6, fontSize: 14, fontWeight: 650 }}>
                    {item}
                  </li>
                ))}
              </ol>
            </div>

            <div className="panelTitle" style={{ marginBottom: 10 }}>
              Blended pillar scores
            </div>

            <div className="pillarsGrid">
              {pillarList.map((p, idx) => (
                <div className="pillBox" key={idx}>
                  <div className="pillLabel">{p.label}</div>
                  <div className="pillValue">{p.value ?? "—"}</div>
                </div>
              ))}
            </div>

            <div className="panelDivider" />

            <div className="panelTitle" style={{ marginBottom: 10 }}>
              Financial risk & opportunity
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
              <div className="pillLabel" style={{ marginBottom: 6 }}>
                Estimated annual value at stake
              </div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {formatCurrency(totalValueAtStake)}
              </div>
              <div className="mutedSmall" style={{ marginTop: 6 }}>
                Based on your current HRI score and organisation inputs, this is the estimated financial exposure across your workforce.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <div className="pillBox">
                <div className="pillLabel">Turnover cost</div>
                <div className="pillValue">{formatCurrency(turnoverCost)}</div>
                <div className="mutedSmall" style={{ marginTop: 6 }}>
  Estimated annual turnover exposure based on your workforce profile and current people-risk indicators.
</div>

              <div className="pillBox">
                <div className="pillLabel">Absence cost</div>
                <div className="pillValue">{formatCurrency(absenceCost)}</div>
                <div className="mutedSmall" style={{ marginTop: 6 }}>
  Estimated annual absence-related cost across your workforce based on current organisational data.
</div>

              <div className="pillBox">
                <div className="pillLabel">Productivity opportunity</div>
                <div className="pillValue">{formatCurrency(productivityOpportunity)}</div>
                <div className="mutedSmall" style={{ marginTop: 6 }}>
  Estimated productivity opportunity available through improvements in workforce experience, engagement and performance.
</div>

            <div className="linkRow">
              <Link className="linkChip" href="/dashboard/hri-assessment">
                Internal Assessment
              </Link>
              <Link className="linkChip" href="/dashboard/employee-pulse">
                Employee Pulse
              </Link>
              <Link className="linkChip" href="/dashboard/scores">
                Scores
              </Link>
              <Link className="linkChip" href="/dashboard/org-metrics">
                Update organisation data
              </Link>
            </div>
          </div>

          <OrgMetricsCard metrics={metrics} loading={loading} />
        </div>
      )}
    </div>
  );
}

function OrgMetricsCard({ metrics, loading }) {
  const items = [
    {
      k: "Organisation",
      v: metrics?.name || "Your organisation",
    },
    {
      k: "Employees",
      v: metrics?.employee_count != null ? metrics.employee_count : "—",
    },
    {
      k: "Average salary",
      v: metrics?.avg_salary != null
        ? `£${Number(metrics.avg_salary).toLocaleString()}`
        : "—",
    },
    {
      k: "Turnover rate",
      v: metrics?.turnover_rate != null ? `${metrics.turnover_rate}%` : "—",
    },
    {
      k: "Absence days / employee",
      v:
        metrics?.absent_days_per_employee != null
          ? metrics.absent_days_per_employee
          : "—",
    },
    {
      k: "Annual wellbeing spend",
      v:
        metrics?.annual_wellbeing_spend != null
          ? `£${Number(metrics.annual_wellbeing_spend).toLocaleString()}`
          : "—",
    },
    {
      k: "Engagement score",
      v: metrics?.engagement_score != null ? `${metrics.engagement_score}/100` : "—",
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

      <div className="metricsGrid">
        {items.map((it, i) => (
          <div className="metric" key={i}>
            <div className="metricK">{it.k}</div>
            <div className="metricV">{it.v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/dashboard/org-metrics" className="linkChip">
          Update organisation data
        </Link>
      </div>
    </div>
  );
}
