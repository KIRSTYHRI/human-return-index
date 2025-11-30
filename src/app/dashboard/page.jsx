"use client";

import { useEffect, useState } from "react";

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
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {/* your dashboard content ONLY */}
      {/* (your existing cards, metrics, etc go here — no header) */}
    </>
  );
}
