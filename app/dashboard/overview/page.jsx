"use client";

import { useEffect, useState } from "react";
import CurrentAssessmentCard from "../CurrentAssessmentCard";
import { apiFetch } from "../../lib/apiFetch";

export const dynamic = "force-dynamic";

function Stat({ label, value }) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14,
      padding: 14,
      background: "rgba(255,255,255,0.03)"
    }}>
      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value ?? "—"}</div>
    </div>
  );
}

export default function DashboardOverview() {
  const [org, setOrg] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [orgErr, setOrgErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetch("/api/me/org");
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to load org");
        setOrg(json);
      } catch (e) {
        setOrgErr(e.message);
      } finally {
        setLoadingOrg(false);
      }
    }
    load();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Human Return Index™ Dashboard</h1>
        <p style={{ marginTop: 6, opacity: 0.8 }}>
          Real-time view of how your people are doing — and what that means for performance, risk and ROI.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18 }}>
        <div>
          <CurrentAssessmentCard />
        </div>

        <div style={{
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: 16,
          background: "rgba(255,255,255,0.03)"
        }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Organisation metrics</h3>

          {loadingOrg && <div style={{ opacity: 0.8 }}>Loading organisation…</div>}
          {orgErr && <div style={{ color: "#ff6b6b" }}>{orgErr}</div>}

          {!loadingOrg && !orgErr && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Stat label="Organisation" value={org?.organisation?.name || org?.name || "Your organisation"} />
              <Stat label="Employees" value={org?.organisation?.employees ?? org?.employees} />
              <Stat label="Turnover rate" value={org?.organisation?.turnover_rate ?? org?.turnover_rate} />
              <Stat label="Avg salary" value={org?.organisation?.avg_salary ?? org?.avg_salary} />
            </div>
          )}

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            (This panel pulls from <code>/api/me/org</code>. We can swap it to <code>/api/org-metrics</code> once your metrics shape is final.)
          </div>
        </div>
      </div>
    </main>
  );
}
