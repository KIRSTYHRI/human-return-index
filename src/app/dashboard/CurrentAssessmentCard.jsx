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

        // 1) Get current assessment overview
        const overviewRes = await fetch("/api/overview", { cache: "no-store" });
        const overviewJson = await overviewRes.json();

        if (!overviewRes.ok || !overviewJson.ok) {
          throw new Error(overviewJson.error || "Failed to load overview");
        }

        const ov = overviewJson.overview;
        setOverview(ov);

        if (!ov.assessment_id) {
          setScores([]);
          return;
        }

        // 2) Get pillar scores for this assessment
        const scoresRes = await fetch(
          `/api/assessment-scores?assessment_id=${encodeURIComponent(
            ov.assessment_id
          )}`,
          { cache: "no-store" }
        );

        const scoresJson = await scoresRes.json();

        if (!scoresRes.ok || !scoresJson.ok) {
          throw new Error(scoresJson.error || "Failed to load scores");
        }

        setScores(scoresJson.scores || []);
      } catch (err) {
        console.error("Error loading current assessment card:", err);
        setError(err.message || "Something went wrong loading assessment");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const hasScores = scores && scores.length > 0;
  const overallScore =
    hasScores
      ? Math.round(
          scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length
        )
      : null;

  const badgeLabel = computeBadge(overallScore);

  return (
    <section
      style={{
        borderRadius: 16,
        border: "1px solid #eee",
        padding: 20,
        marginBottom: 24,
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
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
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Current HRI Assessment
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              opacity: 0.7,
            }}
          >
            Live view of your latest internal assessment, powered by real
            responses and pillar scores.
          </p>
        </div>
        {badgeLabel && (
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background:
                badgeLabel === "HRI Accredited Plus"
                  ? "#000"
                  : badgeLabel === "HRI Accredited"
                  ? "#ffe169"
                  : "#f4f4f4",
              color:
                badgeLabel === "HRI Accredited Plus"
                  ? "#fff"
                  : badgeLabel === "HRI Accredited"
                  ? "#000"
                  : "#444",
              whiteSpace: "nowrap",
            }}
          >
            {badgeLabel}
          </span>
        )}
      </div>

      {loading && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.7,
            marginTop: 4,
          }}
        >
          Loading current assessment…
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            background: "#ffe6e6",
            color: "#7a0000",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && !overview && (
        <div
          style={{
            marginTop: 8,
            fontSize: 13,
            opacity: 0.8,
          }}
        >
          No current assessment found. Set one up to see your HRI in action.
        </div>
      )}

      {!loading && !error && overview && (
        <>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 12,
              marginBottom: 12,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  opacity: 0.6,
                  marginBottom: 4,
                }}
              >
                Assessment
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {overview.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                {overview.period_start} → {overview.period_end} • Status:{" "}
                {overview.status}
              </div>
            </div>

            <div
              style={{
                marginLeft: "auto",
                textAlign: "right",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  opacity: 0.6,
                  marginBottom: 2,
                }}
              >
                Overall HRI Score
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                }}
              >
                {overallScore != null ? `${overallScore}` : "–"}
                {overallScore != null && (
                  <span
                    style={{
                      fontSize: 14,
                      opacity: 0.7,
                      marginLeft: 2,
                    }}
                  >
                    /100
                  </span>
                )}
              </div>
            </div>
          </div>

          {hasScores && (
            <div
              style={{
                marginTop: 12,
                borderTop: "1px solid #f2f2f2",
                paddingTop: 10,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 8,
              }}
            >
              {scores.map((s) => (
                <div
                  key={s.pillar}
                  style={{
                    padding: 8,
                    borderRadius: 10,
                    border: "1px solid #f4f4f4",
                    background: "#fafafa",
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    {s.pillar}
                  </div>
                  <div
                    style={{
                      opacity: 0.8,
                    }}
                  >
                    {Math.round(s.score)}/100
                  </div>
                </div>
              ))}
            </div>
          )}

          {!hasScores && (
            <div
              style={{
                marginTop: 8,
                fontSize: 13,
                opacity: 0.75,
              }}
            >
              No pillar scores found for this assessment yet. Complete the
              internal assessment to generate your HRI scores.
            </div>
          )}
        </>
      )}
    </section>
  );
}
