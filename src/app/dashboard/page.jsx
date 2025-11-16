"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/overview", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok || !j.ok) {
          setError(j.error || "Error loading overview");
          return;
        }
        setOverview(j.overview);
        setScores(j.scores || []);
      } catch (err) {
        setError(err.message || "Unknown error");
      }
    })();
  }, []);

  if (error)
    return (
      <main style={{ padding: 24, color: "crimson" }}>
        Error: {error}
      </main>
    );

  if (!overview)
    return <main style={{ padding: 24 }}>Loading…</main>;

  const createdDate = overview.assessment_created_at
    ? new Date(overview.assessment_created_at)
    : null;

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Human Return Index™ – Pilot Dashboard
      </h1>
      <p style={{ opacity: 0.8, marginBottom: 24 }}>
        This is your live preview of the Human Return Index™ dashboard.
        The data below is coming from your Supabase “Pilot Test” assessment.
      </p>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Left: latest assessment info */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ opacity: 0.6, fontSize: 12 }}>Latest Assessment</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {overview.title}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Status: {overview.status} • Period: {overview.period_start} →{" "}
            {overview.period_end}
          </div>
          {createdDate && (
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Created: {createdDate.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Right: overall score + badge */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 16,
            textAlign: "right",
          }}
        >
          <div style={{ opacity: 0.6, fontSize: 12 }}>Overall HRI Score</div>
          <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>
            {overview.overall_score != null
              ? Math.round(overview.overall_score)
              : "–"}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Badge</div>
            <div style={{ fontWeight: 700 }}>
              {overview.badge_level ?? "No badge yet"}
            </div>
            {overview.badge_awarded_at && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                Awarded:{" "}
                {new Date(
                  overview.badge_awarded_at
                ).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 style={{ marginBottom: 12 }}>Pillar Scores</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          {scores.length === 0 && (
            <div style={{ opacity: 0.7 }}>No scores yet.</div>
          )}

          {scores.map((s, idx) => (
            <div
              key={`${s.pillar}-${idx}`}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ opacity: 0.6, fontSize: 12 }}>{s.pillar}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {Math.round(s.score)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
