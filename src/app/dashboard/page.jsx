"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          setError(json.error || "Error loading overview");
          return;
        }

        setOverview(json.overview);
        setScores(json.scores || []);
      } catch (err) {
        setError("Network error loading overview");
      }
    })();
  }, []);

  if (error) {
    return (
      <main style={{ padding: 24, color: "crimson" }}>
        Error: {error}
      </main>
    );
  }

  if (!overview) {
    return <main style={{ padding: 24 }}>Loading…</main>;
  }

  return (
    <main>
      <h1>Human Return Index™ – Pilot Dashboard</h1>
      <p>
        This is your live preview of the Human Return Index™ dashboard. The data
        below is coming from your Supabase “{overview.title}” assessment.
      </p>

      <section>
        {/* Top row: Overall score + badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ opacity: 0.6 }}>Overall HRI Score</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>
              {overview.overall_score != null
                ? Math.round(overview.overall_score)
                : "—"}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ opacity: 0.6 }}>Badge</div>
            <div style={{ fontWeight: 700 }}>
              {overview.badge_level || "No badge yet"}
            </div>
            {overview.badge_awarded_at && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Awarded:{" "}
                {new Date(overview.badge_awarded_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Latest assessment details */}
        <h3>Latest Assessment</h3>
        <div>
          <div style={{ fontWeight: 700 }}>{overview.title}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Status: {overview.status} • Period: {overview.period_start} →{" "}
            {overview.period_end}
          </div>
        </div>

        {/* Pillar scores */}
        <h3 style={{ marginTop: 16 }}>Pillar Scores</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          {scores.length > 0 ? (
            scores.map((s) => (
              <div
                key={s.pillar}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ opacity: 0.6 }}>{s.pillar}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {Math.round(s.score)}
                </div>
              </div>
            ))
          ) : (
            <div style={{ opacity: 0.7 }}>No scores yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
