"use client";

import { useEffect, useState } from "react";

const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null); // latest pulse row
  const [hri, setHri] = useState(null); // latest hri_scores row
  const [error, setError] = useState("");
  const [recalcLoading, setRecalcLoading] = useState(false);

  async function loadDashboardData() {
    // 1) Latest pulse
    const res = await fetch(`/api/pulse-latest?organisation_id=${ORG_ID}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || json.ok === false) {
      throw new Error(json?.error || "Failed to load latest pulse score");
    }
    setRow(json.data);

    // 2) Latest HRI score
    const hriRes = await fetch(`/api/hri-score?organisation_id=${ORG_ID}`, {
      cache: "no-store",
    });
    const hriJson = await hriRes.json();
    if (hriRes.ok && hriJson.ok !== false) {
      setHri(hriJson.data);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await loadDashboardData();
      } catch (e) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecalculate() {
    try {
      setRecalcLoading(true);
      setError("");

      // Trigger calculation (writes to hri_scores)
      const res = await fetch(`/api/calculate-hri`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json?.error || "Failed to recalculate HRI");
      }

      // Refresh displayed data
      await loadDashboardData();
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setRecalcLoading(false);
    }
  }

  const pulsePct = row?.average_score
    ? Math.round((Number(row.average_score) / 5) * 100)
    : null;

  const hriPct = hri?.hri_score != null ? Math.round(Number(hri.hri_score)) : null;

  return (
    <main style={{ color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Overview</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Your latest Employee Pulse results + your overall HRI score (live test data).
      </p>

      {loading && <p style={{ color: "#9CA3AF" }}>Loading dashboard…</p>}

      {!loading && error && <p style={{ color: "#F97316" }}>{error}</p>}

      {!loading && !error && !row && (
        <p style={{ color: "#9CA3AF" }}>
          No scored submissions yet. Submit the Employee Pulse once and your score will show here.
        </p>
      )}

      {!loading && !error && row && (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <Card title="Human Return Index™" big>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
              {hriPct == null ? "—" : `${hriPct}%`}
            </div>

            <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>
              Employer {hri?.employer_score != null ? Number(hri.employer_score).toFixed(1) : "—"}% · Employee{" "}
              {hri?.employee_score != null ? Number(hri.employee_score).toFixed(1) : "—"}%
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
              Badge: <b style={{ color: "#FEE000" }}>{hri?.bad
