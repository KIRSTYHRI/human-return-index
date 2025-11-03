"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/overview", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j?.error || `HTTP ${r.status}`);
        setOverview(j.overview || null);
        setScores(Array.isArray(j.scores) ? j.scores : []);
      } catch (e) {
        setError(e.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <div style={{ opacity: 0.7 }}>Loading your HRI dashboard…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: 24, color: "crimson" }}>
        Error: {error}
      </main>
    );
  }

  if (!overview) {
    return (
      <main style={{ padding: 24 }}>
        <h1>HRI Dashboard</h1>
        <section>
          <div style={{ opacity: 0.7 }}>
            No assessment found yet. Create one in Supabase, then refresh.
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <h1>HRI Dashboard</h1>
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ opacity: 0.6 }}>Latest Assessment</div>
            <div style={{ fontWeight: 700 }}>{overview.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Status: {overview.status} • Created:{" "}
              {new Date(overview.assessment_created_at).toLocaleDateString()}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ opacity: 0.6 }}>Badge</div>
            <div style={{ fontWeight: 800, color: "var(--hri-yellow)" }}>
              {overview.badge_level ?? "NONE"}
            </div>
            {overview.badge_awarded_at && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Awarded: {new Date(overview.badge_awarded_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

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
                  background: "var(--hri-white)",
                }}
              >
                <div style={{ opacity: 0.6 }}>{s.pillar}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{Math.round(s.score)}</div>
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
