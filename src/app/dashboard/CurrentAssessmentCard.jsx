"use client";

import { useEffect, useState } from "react";

function computeBadge(overallScore) {
  if (overallScore == null) return "No badge yet";
  if (overallScore >= 80) return "HRI Accredited Plus";
  if (overallScore >= 60) return "HRI Accredited";
  return "No badge yet";
}

export default function CurrentAssessmentCard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        // 1) Overview
        const overviewRes = await fetch("/api/overview", { cache: "no-store" });
        const overviewJson = await overviewRes.json().catch(() => ({}));

        if (!overviewRes.ok || overviewJson.ok === false) {
          throw new Error(overviewJson.error || "Failed to load overview");
        }

        const ov = overviewJson?.overview ?? null;
        setOverview(ov);

        // If no current assessment yet → stop gracefully
        if (!ov || !ov.assessment_id) {
          setScores([]);
          return;
        }

        // 2) Pillar scores
        const scoresRes = await fetch(
          `/api/assessment-scores?assessment_id=${encodeURIComponent(
            ov.assessment_id
          )}`,
          { cache: "no-store" }
        );

        const scoresJson = await scoresRes.json().catch(() => ({}));

        if (!scoresRes.ok || scoresJson.ok === false) {
          throw new Error(scoresJson.error || "Failed to load scores");
        }

        setScores(Array.isArray(scoresJson.scores) ? scoresJson.scores : []);
      } catch (err) {
        console.error("Error loading current assessment card:", err);
        setError(err?.message || "Something went wrong loading assessment");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const hasScores = Array.isArray(scores) && scores.length > 0;

  const overallScore = hasScores
    ? Math.round(scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / scores.length)
    : null;

  const badgeLabel = computeBadge(overallScore);

  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid #1F2937",
        padding: 20,
        marginBottom: 24,
        background: "#070A12",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0, marginBottom: 6 }}>
            Current HRI Assessment
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#9CA3AF" }}>
            Live view of your latest internal assessment, powered by real responses and pillar scores.
          </p>
        </div>

        <span
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 900,
            background:
              badgeLabel === "HRI Accredited Plus"
                ? "#000"
                : badgeLabel === "HRI Accredited"
                ? "#FEE000"
                : "#111827",
            color:
              badgeLabel === "HRI Accredited Plus"
                ? "#fff"
                : badgeLabel === "HRI Accredited"
                ? "#111827"
                : "#9CA3AF",
            whiteSpace: "nowrap",
            border: "1px solid #1F2937",
          }}
        >
          {badgeLabel}
        </span>
      </div>

      {loading && <div style={{ fontSize: 13, color: "#9CA3AF" }}>Loading current assessment…</div>}

      {error && (
        <div
          style={{
            marginTop: 10,
            padding: 10,
            borderRadius: 10,
            background: "#2A0B0B",
            color: "#FCA5A5",
            border: "1px solid #7F1D1D",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !overview && (
        <div style={{ marginTop: 10, fontSize: 13, color: "#9CA3AF" }}>
          No current assessment found yet. Create one to see your HRI score here.
        </div>
      )}

      {!loading && !error && overview && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginTop: 14,
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.08, color: "#9CA3AF" }}>
              Assessment
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: "#E5E7EB" }}>
              {overview.title || "Untitled assessment"}
            </div>
            <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 4 }}>
              {overview.period_start || "—"} → {overview.period_end || "—"} • Status:{" "}
              {overview.status || "—"}
            </div>
          </div>

          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 0.08, color: "#9CA3AF" }}>
              Overall HRI Score
            </div>
            <div style={{ fontSize: 28, fontWeight: 1000, color: "#FEE000" }}>
              {overallScore != null ? overallScore : "–"}
              <span style={{ fontSize: 14, color: "#9CA3AF", marginLeft: 4 }}>/100</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
