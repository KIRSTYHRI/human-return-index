"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [orgMetrics, setOrgMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/org-metrics", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Failed to load org metrics");
        }

        setOrgMetrics(json.org_metrics || json.data || json || null);
      } catch (err) {
        console.error("Settings load error:", err);
        setError(err?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#E5E7EB",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
        Org Inputs
      </h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 16 }}>
        These inputs feed your ROI estimates and dashboard benchmarking.
      </p>

      {loading && (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Loading…</p>
      )}

      {error && (
        <div
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #F97316",
            background: "#451a03",
            color: "#FED7AA",
            fontSize: 13,
            marginBottom: 16,
            whiteSpace: "pre-wrap",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
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
                ? Number(orgMetrics.employee_count).toLocaleString("en-GB")
                : "–"
            }
          />
          <MetricCard
            label="Average salary"
            value={
              orgMetrics?.avg_salary != null
                ? `£${Number(orgMetrics.avg_salary).toLocaleString("en-GB")}`
                : "–"
            }
          />
          <MetricCard
            label="Turnover rate"
            value={
              orgMetrics?.turnover_rate != null
                ? `${Number(orgMetrics.turnover_rate)}%`
                : "–"
            }
          />
          <MetricCard
            label="Absence days per employee"
            value={
              orgMetrics?.absent_days_per_employee != null
                ? Number(orgMetrics.absent_days_per_employee)
                : "–"
            }
          />
          <MetricCard
            label="Annual wellbeing spend"
            value={
              orgMetrics?.annual_wellbeing_spend != null
                ? `£${Number(orgMetrics.annual_wellbeing_spend).toLocaleString(
                    "en-GB"
                  )}`
                : "–"
            }
          />
          <MetricCard
            label="Engagement score"
            value={
              orgMetrics?.engagement_score != null
                ? `${Number(orgMetrics.engagement_score)}/100`
                : "–"
            }
          />
        </div>
      )}
    </div>
  );
}

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
      <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#F9FAFB",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}
