"use client";

import { useEffect, useState } from "react";

const DEFAULT_PILLARS = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

export default function ScoresSettingsPage() {
  const [scores, setScores] = useState(
    DEFAULT_PILLARS.map((p) => ({ pillar: p, score: 75 }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load existing scores from API
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/pillar-scores", { cache: "no-store" });
        const j = await res.json();

        if (!res.ok || !j.ok) {
          throw new Error(j.error || "Error loading scores");
        }

        if (Array.isArray(j.scores) && j.scores.length > 0) {
          // Merge API scores into our default pillar list
          const merged = DEFAULT_PILLARS.map((pillar) => {
            const found = j.scores.find((s) => s.pillar === pillar);
            return {
              pillar,
              score:
                found && typeof found.score === "number"
                  ? found.score
                  : 75,
            };
          });
          setScores(merged);
        }
      } catch (err) {
        console.error("Error loading pillar scores:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateScore(pillar, value) {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setScores((prev) =>
      prev.map((s) =>
        s.pillar === pillar
          ? { ...s, score: num }
          : s
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/pillar-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores }),
      });

      const j = await res.json();

      if (!res.ok || !j.ok) {
        throw new Error(j.error || "Error saving scores");
      }

      setMessage("Pillar scores saved. Your dashboard has been updated.");
    } catch (err) {
      console.error("Error saving pillar scores:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        HRI Pillar Scores
      </h1>

      <p style={{ marginBottom: 16, opacity: 0.85 }}>
        Adjust the scores for each Human Return Index™ pillar. These feed
        directly into your Pilot Test assessment and the HRI dashboard.
      </p>

      {loading && <p>Loading current scores…</p>}

      {error && (
        <p style={{ color: "crimson", marginBottom: 12 }}>
          Error: {error}
        </p>
      )}

      {message && (
        <p style={{ color: "green", marginBottom: 12 }}>
          {message}
        </p>
      )}

      {!loading && (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {scores.map((s) => (
              <div
                key={s.pillar}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fafafa",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                    fontSize: 14,
                  }}
                >
                  {s.pillar}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={s.score}
                    onChange={(e) =>
                      updateScore(s.pillar, e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={s.score}
                    onChange={(e) =>
                      updateScore(s.pillar, e.target.value)
                    }
                    style={{
                      width: 60,
                      padding: 4,
                      borderRadius: 6,
                      border: "1px solid #ddd",
                    }}
                  />
                </div>

                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  0 = critical risk • 100 = excellent performance
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background: "#111",
              color: "#fff",
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save pillar scores"}
          </button>
        </form>
      )}
    </main>
  );
}
