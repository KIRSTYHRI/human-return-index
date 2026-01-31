"use client";

import { useEffect, useState } from "react";

const PILLARS = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

export default function AssessmentDetailPage({ params }) {
  const { id } = params;

  const [data, setData] = useState(null);
  const [overallScore, setOverallScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // editing state
  const [editing, setEditing] = useState(false);
  const [formScores, setFormScores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  function recalcOverallFromScores(scores) {
    const nums = (scores || [])
      .map((s) => Number(s.score))
      .filter((n) => Number.isFinite(n));
    if (nums.length > 0) {
      const avg = nums.reduce((sum, n) => sum + n, 0) / nums.length;
      setOverallScore(avg);
    } else {
      setOverallScore(null);
    }
  }

  // Load assessment + scores
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/assessments/${id}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load assessment");
        }

        setData(json);
        recalcOverallFromScores(json.scores || []);

        // Build formScores array for editing, one row per pillar
        const scores = json.scores || [];
        const byPillar = new Map((scores || []).map((s) => [s.pillar, s.score]));

        const initialFormScores = PILLARS.map((pillar) => ({
          pillar,
          score: byPillar.has(pillar) ? String(byPillar.get(pillar)) : "",
        }));

        setFormScores(initialFormScores);
      } catch (err) {
        console.error("Error loading assessment:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function handleScoreChange(idx, value) {
    setFormScores((prev) => prev.map((row, i) => (i === idx ? { ...row, score: value } : row)));
  }

  function pillarScoreTo1to5(scoreStr) {
    const n = Number(scoreStr);
    if (!Number.isFinite(n)) return null;
    if (n <= 20) return 1;
    if (n <= 40) return 2;
    if (n <= 60) return 3;
    if (n <= 80) return 4;
    return 5;
  }

  function buildResponsesFromPillars() {
    // 5 pillars -> 25 questions (5 each)
    const responses = {};
    formScores.forEach((row, pillarIndex) => {
      const ans = pillarScoreTo1to5(row.score); // 1..5
      const startQ = pillarIndex * 5 + 1; // 1, 6, 11, 16, 21
      for (let i = 0; i < 5; i++) {
        responses[`q${startQ + i}`] = ans;
      }
    });
    return responses;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      // 1) Build responses (q1..q25) from pillar scores (MVP mapping)
      const responses = buildResponsesFromPillars();

      // Make sure we have something to save (at least one pillar score provided)
      const hasAny = Object.values(responses).some((v) => v != null);
      if (!hasAny) {
        throw new Error("Please enter at least one pillar score before saving.");
      }

      // 2) Save pillar scores + responses to the assessment route
      const res = await fetch(`/api/assessments/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: formScores, // your pillar scores (0–100)
          responses,          // ✅ new: q1..q25 answers (1–5)
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save assessment");
      }

      // 3) Trigger scoring calculation (reads responses from DB and writes overall_score + pillar_scores)
      const scoreRes = await fetch(`/api/assessment-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id: id }),
      });

      const scoreJson = await scoreRes.json();
      if (!scoreRes.ok || !scoreJson.ok) {
        throw new Error(scoreJson.error || "Saved, but failed to calculate scores");
      }

      // 4) Reload to update UI
      const fresh = await fetch(`/api/assessments/${id}`, { cache: "no-store" });
      const freshJson = await fresh.json();
      if (!fresh.ok || !freshJson.ok) {
        throw new Error(freshJson.error || "Failed to reload assessment");
      }

      setData(freshJson);
      recalcOverallFromScores(freshJson.scores || []);

      setSaveMessage("Assessment saved + HRI score calculated ✅");
      setEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 960, margin: "0 auto" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Human Return Index™ – Assessment</h1>
        <p style={{ opacity: 0.8 }}>Loading assessment…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 960, margin: "0 auto", color: "crimson" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Human Return Index™ – Assessment</h1>
        <p>Something went wrong:</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error || "No data"}</pre>
      </main>
    );
  }

  const { assessment, scores } = data;

  return (
    <main style={{ padding: 24, fontFamily: "system-ui", maxWidth: 960, margin: "0 auto" }}>
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

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{assessment.title}</h1>

      <p style={{ opacity: 0.8, marginBottom: 12 }}>
        Created: {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString() : "-"} • Status:{" "}
        {assessment.status}
      </p>

      {/* Top summary */}
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
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Current? {assessment.is_current ? "✅ Yes" : "—"}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ opacity: 0.6, fontSize: 12 }}>Overall HRI Score</div>
          <div style={{ fontSize: 32, fontWeight: 800 }}>{overallScore != null ? Math.round(overallScore) : "–"}</div>

          <div style={{ marginTop: 12 }}>
            <div style={{ opacity: 0.6, fontSize: 12 }}>Badge</div>
            <div style={{ fontWeight: 700 }}>{assessment.badge_level || "No badge awarded"}</div>
            {assessment.badge_awarded_at && (
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Awarded: {new Date(assessment.badge_awarded_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Edit button + messages */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 16 }}>
        <button
          type="button"
          onClick={() => setEditing((prev) => !prev)}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            background: "black",
            color: "white",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          {editing ? "Cancel editing" : "Start / Edit Assessment"}
        </button>

        {saveMessage && <span style={{ fontSize: 13, color: "green" }}>{saveMessage}</span>}
        {saveError && <span style={{ fontSize: 13, color: "crimson" }}>{saveError}</span>}
      </div>

      {/* Edit form */}
      {editing && (
        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Edit pillar scores</h2>
          <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
            Enter a score from 0 to 100 for each pillar based on your latest assessment results.
          </p>

          <form onSubmit={handleSave}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {formScores.map((row, idx) => (
                <div
                  key={row.pillar}
                  style={{
                    border: "1px solid #f2f2f2",
                    borderRadius: 10,
                    padding: 10,
                    background: "#fafafa",
                  }}
                >
                  <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>{row.pillar}</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.score}
                    onChange={(e) => handleScoreChange(idx, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 6,
                      border: "1px solid #ddd",
                      fontSize: 14,
                    }}
                    placeholder="0–100"
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
                background: saving ? "#555" : "black",
                color: "white",
                fontSize: 14,
                cursor: saving ? "default" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save assessment scores + calculate HRI"}
            </button>
          </form>
        </section>
      )}

      {/* Read-only pillar scores */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Pillar Scores</h2>
        {!scores || scores.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No pillar scores recorded for this assessment yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {scores.map((s) => (
              <div key={s.pillar} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{s.pillar}</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{Math.round(Number(s.score))}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
