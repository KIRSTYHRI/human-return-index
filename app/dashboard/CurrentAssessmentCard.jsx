"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/apiFetch";

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
        setOverview(data?.overview || null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <h2 className="cardTitle">Current HRI Assessment</h2>
        <span className="pill">{loading ? "Loading…" : "Live"}</span>
      </div>

      <p className="pageSub" style={{ marginTop: 0 }}>
        Live view of your latest internal assessment, powered by real responses and pillar scores.
      </p>

      {error && <p style={{ color: "#ff6b6b" }}>{error}</p>}

      {!error && !loading && (
        <div className="stats">
          <div className="stat">
            <div className="statLabel">Overall HRI Score</div>
            <div className="statValue">{overview?.overall_score ?? "—"}</div>
          </div>
          <div className="stat">
            <div className="statLabel">Status</div>
            <div className="statValue">{overview?.status ?? "—"}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <Link className="pill" href="/dashboard/assessment">Internal Assessment</Link>
        <Link className="pill" href="/dashboard/employee-pulse">Employee Pulse</Link>
        <Link className="pill" href="/dashboard/scores">Scores</Link>
      </div>
    </div>
  );
}
