"use client";

import { useEffect, useState } from "react";
import Link from "next/link";


export default function AssessmentDetailPage({ params }) {
  const { id } = params;
  const [data, setData] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const res = await fetch(`/api/assessments/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load assessment");
        }

        setData(json);

        const scores = json.scores || [];
        const nums = scores
          .map((s) => Number(s.score))
          .filter((n) => Number.isFinite(n));

        if (nums.length > 0) {
          const avg =
            nums.reduce((sum, n) => sum + n, 0) / nums.length;
          setOverallScore(avg);
        } else {
          setOverallScore(null);
        }
      } catch (err) {
        console.error("Error loading assessment:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Assessment
        </h1>
        <p style={{ opacity: 0.8 }}>Loading assessment…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
          color: "crimson",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Assessment
        </h1>
        <p>Something went wrong:</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error || "No data"}</pre>
      </main>
    );
  }

  const { assessment, scores } = data;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <a
        href="/dashboard/assessments"
        style={{
          fontSize: 13,
          textDecoration: "underline",
          opacity: 0.7,
          display: "inline-block",
          marginBottom: 8,
        }}
      >
        ← Back to assessments
      </a>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
        {assessment.title}
      </h1>

      <p style={{ opacity: 0.8, marginBottom: 12 }}>
        Created:{" "}
        {assessment.created_at
          ? new Date(assessment.created_at).toLocaleDateString()
          : "-"}{" "}
        • Status: {assessment.status}
      </p>

      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ opacity: 0.6, fontSize: 12 }}>Assessment period</div>
          <div style={{ fontWeight: 600 }}>
            {assessment.period_start} → {assessment.period_end}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
            Current? {assessment.is_current ? "✅ Yes" : "—"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ opacity: 0.6, fontSize: 12 }}>Overall HRI Score</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>
            {overallScore != null ? Math.round(overallScore) : "–"}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Badge</div>
            <div style={{ fontWeight: 700 }}>
              {assessment.badge_level || "No badge awarded"}
            </div>
            {assessment.badge_awarded_at && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Awarded:{" "}
                {new Date(
                  assessment.badge_awarded_at
                ).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Pillar Scores
        </h2>
        {(!scores || scores.length === 0) ? (
          <p style={{ opacity: 0.7 }}>No pillar scores recorded for this assessment yet.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
              gap: 12,
            }}
          >
            {scores.map((s) => (
              <div
                key={s.pillar}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ opacity: 0.7, fontSize: 12 }}>{s.pillar}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {Math.round(Number(s.score))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
