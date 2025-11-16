"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load overview");
        }

        setOverview(json.overview);
        setScores(json.scores ?? []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <main style={{ padding: 24 }}>Loading dashboard…</main>;
  }

  if (error) {
    return (
      <main style={{ padding: 24, color: "crimson" }}>
        Error: {error}
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Human Return Index™ – Pilot Dashboard</h1>
      <p style={{ marginTop: 8, opacity: 0.7 }}>
        This is your live preview of the Human Return Index™ dashboard.
        The data below is coming from your Supabase “Pilot Test” assessment.
      </p>

      <section style={{ marginTop: 24 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <div>
            <div style={{ opacity: 0.6 }}>Latest Assessment</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {overview.title}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Status: {overview.status} • Period:{" "}
              {overview.period_start} → {overview.period_end}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ opacity: 0.6 }}>Badge</div>
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

        <h3 style={{ marginTop: 24 }}>Pillar Scores</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 12,
            marginTop: 8,
          }}
        >
          {scores.length === 0 && (
            <div style={{ opacity: 0.7 }}>No scores yet.</div>
          )}
          {scores.map((s) => (
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
          ))}
        </div>
      </section>
    </main>
  );
}
