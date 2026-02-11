"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/apiFetch";

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return "—";
  }
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function CurrentAssessmentCard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/overview");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load overview");
        setOverview(data?.overview || data || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const overall = useMemo(() => {
    return (
      num(overview?.overall_score) ??
      num(overview?.overallScore) ??
      num(overview?.hri_score) ??
      null
    );
  }, [overview]);

  const latest = overview?.latest_assessment || overview?.latestAssessment || overview?.assessment || null;

  const title =
    latest?.title ||
    latest?.name ||
    overview?.assessment_title ||
    "HRI Assessment";

  const periodStart =
    latest?.period_start ||
    latest?.periodStart ||
    latest?.start_date ||
    overview?.period_start;

  const periodEnd =
    latest?.period_end ||
    latest?.periodEnd ||
    latest?.end_date ||
    overview?.period_end;

  const createdAt = latest?.created_at || latest?.createdAt || overview?.created_at;

  const status =
    latest?.status ||
    overview?.status ||
    "—";

  const badge =
    overview?.badge ||
    overview?.badge_name ||
    overview?.badgeName ||
    null;

  const badgeAwarded =
    overview?.badge_awarded_at ||
    overview?.badgeAwardedAt ||
    null;

  const pillars =
    overview?.pillar_scores ||
    overview?.pillarScores ||
    overview?.pillars ||
    null;

  const pillarList = Array.isArray(pillars)
    ? pillars
    : pillars && typeof pillars === "object"
      ? Object.entries(pillars).map(([k, v]) => ({ label: k, value: v }))
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
          {/* Latest assessment */}
          <div className="panel">
            <div className="panelHeader">
              <div className="panelTitle">LATEST ASSESSMENT</div>
              <div className="panelMeta">{loading ? "—" : status}</div>
            </div>

            <div className="bigRow">
              <div>
                <div className="bigTitle">{title}</div>
                <div className="mutedSmall">
                  Status: {status} · Period: {formatDate(periodStart)} → {formatDate(periodEnd)}
                </div>
                <div className="mutedSmall">
                  Created: {formatDate(createdAt)}
                </div>
              </div>

              <div className="scoreBox">
                <div className="scoreLabel">OVERALL HRI SCORE</div>
                <div className="scoreValue">{overall ?? "—"}<span className="scoreOutOf">/100</span></div>

                <div className="scoreLabel" style={{ marginTop: 10 }}>BADGE</div>
                <div className="badgePill">
                  {badge ? badge : "No badge yet"}
                </div>
                {badgeAwarded && (
                  <div className="mutedSmall" style={{ marginTop: 6 }}>
                    Awarded: {formatDate(badgeAwarded)}
                  </div>
                )}
              </div>
            </div>

            {/* Pillar scores */}
            <div className="panelDivider" />
            <div className="panelTitle" style={{ marginBottom: 10 }}>Pillar scores (internal assessment)</div>

            <div className="pillarsGrid">
              {(pillarList.length ? pillarList : [
                { label: "Growth & Development", value: overview?.pillar_1_score ?? overview?.growth ?? null },
                { label: "Leadership", value: overview?.pillar_2_score ?? overview?.leadership ?? null },
                { label: "Trust & Communication", value: overview?.pillar_3_score ?? overview?.trust ?? null },
                { label: "Wellbeing & Mental Health", value: overview?.pillar_4_score ?? overview?.wellbeing ?? null },
                { label: "Inclusion & Belonging", value: overview?.pillar_5_score ?? overview?.inclusion ?? null },
              ]).map((p, idx) => (
                <div className="pillBox" key={idx}>
                  <div className="pillLabel">{p.label}</div>
                  <div className="pillValue">{num(p.value) ?? "—"}</div>
                </div>
              ))}
            </div>

            <div className="linkRow">
  <Link className="linkChip" href="/dashboard/hri-assessment">Internal Assessment</Link>
  <Link className="linkChip" href="/dashboard/employee-pulse">Employee Pulse</Link>
  <Link className="linkChip" href="/dashboard/scores">Scores</Link>
</div>
          </div>

          {/* Org metrics */}
          <OrgMetricsCard />
        </div>
      )}
    </div>
  );
}

function OrgMetricsCard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/org-metrics");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load org metrics");
        setMetrics(data?.metrics || data || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = [
    { k: "Organisation", v: metrics?.organisation_name || metrics?.organisation || metrics?.org_name || "Your organisation" },
    { k: "Employees", v: metrics?.employees ?? metrics?.headcount ?? "—" },
    { k: "Average salary", v: metrics?.avg_salary ? `£${Number(metrics.avg_salary).toLocaleString()}` : (metrics?.average_salary ? `£${Number(metrics.average_salary).toLocaleString()}` : "—") },
    { k: "Turnover rate", v: metrics?.turnover_rate ? `${metrics.turnover_rate}%` : (metrics?.turnover ? `${metrics.turnover}%` : "—") },
    { k: "Absence days / employee", v: metrics?.absence_days ?? metrics?.absence_days_per_employee ?? "—" },
    { k: "Annual wellbeing spend", v: metrics?.wellbeing_spend ? `£${Number(metrics.wellbeing_spend).toLocaleString()}` : (metrics?.annual_wellbeing_spend ? `£${Number(metrics.annual_wellbeing_spend).toLocaleString()}` : "—") },
    { k: "Engagement score", v: metrics?.engagement_score ? `${metrics.engagement_score}/100` : "—" },
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
