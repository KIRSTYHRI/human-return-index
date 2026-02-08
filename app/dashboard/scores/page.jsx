"use client";

import { useEffect, useState } from "react";

export default function ScoresPage() {
  const [assessmentId, setAssessmentId] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Load current assessment + scores from /api/overview
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load overview");
        }

        setAssessmentId(json.overview.assessment_id);
        setScores(json.scores || []);
      } catch (err) {
        console.error("Error loading scores page:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleScoreChange = (index, value) => {
    const next = [...scores];
    next[index] = {
      ...next[index],
      score: value === "" ? "" : Number(value),
    };
    setScores(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!assessmentId) {
        throw new Error("No assessment_id found");
      }

      const cleaned = scores.map((s) => ({
        pillar: s.pillar,
        score: Number(s.score),
      }));

      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: assessmentId,
          scores: cleaned,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save scores");
      }

      setMessage("Scores saved successfully. Your dashboard is now updated.");
    } catch (err) {
      console.error("Save scores error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
          Human Return Index™ – Edit Pillar Scores
        </h1>
        <p style={{ opacity: 0.8 }}>Loading your current assessment…</p>
      </main>
    );
  }

  if (error) {
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
          Human Return Index™ – Edit Pillar Scores
        </h1>
        <p>Something went wrong:</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
      </main>
    );
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
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Human Return Index™ – Edit Pillar Scores
      </h1>

      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Adjust the HRI pillar scores for the current assessment. This is a
        simple internal control so you can tweak demo data for pilots,
        screenshots and investor decks without touching the database.
      </p>

      {message && (
        <p
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#e6ffed",
            border: "1px solid #b7eb8f",
            fontSize: 13,
          }}
        >
          {message}
        </p>
      )}

      {error && (
        <p
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            borderRadius: 8,
            background: "#fff1f0",
            border: "1px solid #ffa39e",
            fontSize: 13,
          }}
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {scores.map((s, idx) => (
            <div
              key={s.pillar}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                background: "#fafafa",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                Pillar
              </div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{s.pillar}</div>

              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  opacity: 0.7,
                  marginBottom: 4,
                }}
              >
                Score (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={s.score ?? ""}
                onChange={(e) => handleScoreChange(idx, e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              />
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
            fontWeight: 600,
            fontSize: 14,
            cursor: saving ? "default" : "pointer",
            background: "#facc15", // yellow accent
            color: "#000",
          }}
        >
          {saving ? "Saving…" : "Save pillar scores"}
        </button>
      </form>
    </main>
  );
}
