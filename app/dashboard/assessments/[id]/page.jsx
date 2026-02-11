"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

const PILLARS = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

export default function AssessmentDetailPage() {
  const params = useParams();
  const id = params?.id;

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

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/assessments/${id}`, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Failed to load assessment");
        }

        setData(json);
        recalcOverallFromScores(json.scores || []);

        const scores = json.scores || [];
        const byPillar = new Map(scores.map((s) => [s.pillar, s.score]));

        const initialFormScores = PILLARS.map((pillar) => ({
          pillar,
          score: byPillar.has(pillar) ? String(byPillar.get(pillar)) : "",
        }));

        setFormScores(initialFormScores);
      } catch (err) {
        console.error("Error loading assessment:", err);
        setError(err?.message || "Failed to load assessment");
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
    const responses = {};
    formScores.forEach((row, pillarIndex) => {
      const ans = pillarScoreTo1to5(row.score);
      const startQ = pillarIndex * 5 + 1;
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
      if (!id) throw new Error("Missing assessment id in URL.");

      const responses = buildResponsesFromPillars();
      const hasAny = Object.values(responses).some((v) => v != null);
      if (!hasAny) throw new Error("Please enter at least one pillar score before saving.");

      const res = await fetch(`/api/assessments/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scores: formScores,
          responses,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to save assessment");
      }

      const scoreRes = await fetch(`/api/assessment-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id: id }),
      });

      const scoreJson = await scoreRes.json().catch(() => ({}));
      if (!scoreRes.ok || scoreJson?.ok === false) {
        throw new Error(scoreJson?.error || "Saved, but failed to calculate scores");
      }

      const fresh = await fetch(`/api/assessments/${id}`, { cache: "no-store" });
      const freshJson = await fresh.json().catch(() => ({}));
      if (!fresh.ok || freshJson?.ok === false) {
        throw new Error(freshJson?.error || "Failed to reload assessment");
      }

      setData(freshJson);
      recalcOverallFromScores(freshJson.scores || []);
      setSaveMessage("Assessment saved + HRI score calculated ✅");
      setEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!id) {
    return (
      <main style={{ padding: 24, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Assessment</h1>
        <p style={{ opacity: 0.8 }}>Missing assessment id in the URL.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main style={{ padding: 24, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Assessment</h1>
        <p style={{ opacity: 0.8 }}>Loading…</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main style={{ padding: 24, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui", color: "crimson" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>Assessment</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error || "No data"}</pre>
      </main>
    );
  }

  const { assessment, scores } = data;

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto", fontFamily: "system-ui" }}>
      <a href="/dashboard/assessments" style={{ fontSize: 13, textDecoration: "underline", opacity: 0.7 }}>
        ← Back to assessments
      </a>

      <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 10 }}>{assessment?.title || "Assessment"}</h1>

      <p style={{ opacity: 0.8, marginBottom: 12 }}>
        Created: {assessment?.created_at ? new Date(assessment.created_at).toLocaleDateString() : "-"} • Status:{" "}
        {assessment?.status || "-"}
      </p>

      <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <div style={{ opacity: 0.6, fontSize: 12 }}>Overall HRI Score</div>
        <div style={{ fontSize: 34, fontWeight: 950 }}>{overallScore != null ? Math.round(overallScore) : "–"}</div>
      </section>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setEditing((p) => !p)}
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
          {editing ? "Cancel editing" : "Edit pillar scores"}
        </button>

        {saveMessage ? <span style={{ fontSize: 13, color: "green" }}>{saveMessage}</span> : null}
        {saveError ? <span style={{ fontSize: 13, color: "crimson" }}>{saveError}</span> : null}
      </div>

      {editing ? (
        <section style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
              {formScores.map((row, idx) => (
                <div key={row.pillar} style={{ border: "1px solid #f2f2f2", borderRadius: 10, padding: 10 }}>
                  <div style={{ opacity: 0.7, fontSize: 12, marginBottom: 4 }}>{row.pillar}</div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={row.score}
                    onChange={(e) => handleScoreChange(idx, e.target.value)}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd" }}
                    placeholder="0–100"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                background: saving ? "#555" : "black",
                color: "white",
                fontSize: 14,
                cursor: saving ? "default" : "pointer",
              }}
            >
              {saving ? "Saving…" : "Save + calculate"}
            </button>
          </form>
        </section>
      ) : null}

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Pillar Scores</h2>
        {!scores || scores.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No pillar scores recorded yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {scores.map((s) => (
              <div key={s.pillar} style={{ border: "1px solid #eee", borderRadius: 10, padding: 12 }}>
                <div style={{ opacity: 0.7, fontSize: 12 }}>{s.pillar}</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{Math.round(Number(s.score))}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
