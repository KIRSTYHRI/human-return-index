"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const VERSION = "INTERNAL_ASSESSMENT_V3__DB_EMPLOYER_QUESTIONS__25Q__MAP_Q1_25";

// Must match your pillar naming in the DB
const PILLAR_ORDER = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

const SCALE = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

// 1–5 => 20–100
function toHriScore(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n * 20 : null;
}

export default function InternalAssessmentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]); // 25 ordered
  const [answers, setAnswers] = useState({}); // { q1..q25: 1..5 }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debug, setDebug] = useState(null);

  // Load employer questions from DB and normalize order to a stable 1..25
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");
        setDebug(null);

        const res = await fetch("/api/employer-questions", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Failed to load employer questions");
        }

        const raw = Array.isArray(json.questions) ? json.questions : [];

        // Sort by pillar order, then position (1..5). This produces 25 questions.
        const ordered = [];
        for (const pillar of PILLAR_ORDER) {
          const group = raw
            .filter((q) => q.pillar === pillar)
            .sort((a, b) => Number(a.position) - Number(b.position));
          ordered.push(...group);
        }

        if (ordered.length !== 25) {
          console.warn("Expected 25 employer questions, got:", ordered.length);
        }

        setQuestions(ordered);
      } catch (e) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = questions.length;

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((v) => Number(v) >= 1 && Number(v) <= 5).length;
  }, [answers]);

  const allAnswered = total > 0 && answeredCount === total;

  function setAnswer(idx1to25, val) {
    setAnswers((prev) => ({ ...prev, [`q${idx1to25}`]: val }));
  }

  function buildPillarScoresFromAnswers() {
    // Since we force a stable order of 25:
    // 1-5 Leadership, 6-10 Wellbeing, 11-15 Inclusion, 16-20 Growth, 21-25 Trust
    const buckets = [
      { pillar: "Leadership", qs: [1, 2, 3, 4, 5] },
      { pillar: "Wellbeing & Mental Health", qs: [6, 7, 8, 9, 10] },
      { pillar: "Inclusion & Belonging", qs: [11, 12, 13, 14, 15] },
      { pillar: "Growth & Development", qs: [16, 17, 18, 19, 20] },
      { pillar: "Trust & Communication", qs: [21, 22, 23, 24, 25] },
    ];

    return buckets.map((b) => {
      const vals = b.qs
        .map((q) => toHriScore(answers[`q${q}`]))
        .filter((n) => Number.isFinite(n));

      const avg = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : null;

      return {
        pillar: b.pillar,
        score: avg == null ? "" : String(Math.round(avg)),
      };
    });
  }

  async function saveInternalAssessment() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      setDebug(null);

      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      // 1) Get org context
      const orgRes = await fetch("/api/me/org", { cache: "no-store" });
      const orgJson = await orgRes.json().catch(() => ({}));

      const organisation_id =
        orgJson?.organisation_id ||
        orgJson?.organization_id ||
        orgJson?.org_id ||
        orgJson?.organisation?.organisation_id ||
        orgJson?.organization?.organization_id ||
        null;

      if (!orgRes.ok || orgJson?.ok === false || !organisation_id) {
        setDebug({ where: "me-org", status: orgRes.status, orgJson });
        throw new Error(orgJson?.error || "Could not load organisation context.");
      }

      // 2) Create assessment row
      const createRes = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Pilot Baseline Assessment",
          org_id: organisation_id,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || createJson?.ok === false) {
        setDebug({ where: "create-assessment", status: createRes.status, createJson });
        throw new Error(createJson?.error || "Failed to create assessment.");
      }

      const assessment_id = createJson?.assessment?.id || null;
      if (!assessment_id) {
        setDebug({ where: "create-assessment-missing-id", createJson });
        throw new Error("Assessment created but no id returned.");
      }

      // 3) Save pillar scores + responses (q1..q25 1–5)
      const scores = buildPillarScoresFromAnswers();

      const saveRes = await fetch(`/api/assessments/${assessment_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, responses: answers }),
      });

      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || saveJson?.ok === false) {
        setDebug({ where: "save-assessment", status: saveRes.status, saveJson });
        throw new Error(saveJson?.error || "Failed to save assessment data.");
      }

      // 4) Trigger scoring engine
      const scoreRes = await fetch(`/api/assessment-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id }),
      });

      const scoreJson = await scoreRes.json().catch(() => ({}));
      if (!scoreRes.ok || scoreJson?.ok === false) {
        setDebug({ where: "score", status: scoreRes.status, scoreJson });
        throw new Error(scoreJson?.error || "Saved, but failed to calculate scores.");
      }

      setSuccess(`Saved ✅ Internal assessment created + HRI calculated (Assessment ID: ${assessment_id})`);
      setDebug({ version: VERSION, assessment_id, scoreJson });

      router.push(`/dashboard/assessments/${assessment_id}`);
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
        Internal Assessment <span style={{ fontSize: 12, opacity: 0.6 }}>({VERSION})</span>
      </h1>

      <p style={{ opacity: 0.75, marginBottom: 18 }}>
        This uses your real employer question bank from Supabase. Answer 1–5, then we’ll save + calculate your HRI score.
      </p>

      {loading && <p style={{ opacity: 0.75 }}>Loading employer questions…</p>}
      {!loading && error && <p style={{ color: "#F97316", marginBottom: 12 }}>{error}</p>}
      {!loading && success && <p style={{ color: "#34D399", marginBottom: 12, whiteSpace: "pre-wrap" }}>{success}</p>}

      {!loading && debug && (
        <details style={{ marginBottom: 14 }}>
          <summary style={{ cursor: "pointer", opacity: 0.7 }}>Debug (click to expand)</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.75 }}>
            {JSON.stringify(debug, null, 2)}
          </pre>
        </details>
      )}

      {!loading && (
        <div style={{ marginBottom: 14, fontSize: 13, opacity: 0.8 }}>
          {answeredCount} of {total} questions answered.
        </div>
      )}

      {!loading && total === 0 && <p style={{ opacity: 0.75 }}>No employer questions found.</p>}

      {!loading && total > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {questions.map((q, idx) => {
              const globalPos = idx + 1; // 1..25 stable
              const key = `q${globalPos}`;
              const current = Number(answers[key] || 0);

              return (
                <div
                  key={q.id || globalPos}
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
                    {q.pillar}
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 650, marginTop: 6 }}>
                    {globalPos}. {q.question_text}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                    {SCALE.map((s) => {
                      const active = current === s.v;
                      return (
                        <button
                          key={s.v}
                          type="button"
                          onClick={() => setAnswer(globalPos, s.v)}
                          style={{
                            cursor: "pointer",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.18)",
                            padding: "8px 10px",
                            fontWeight: 800,
                            background: active ? "#FEE000" : "transparent",
                            color: active ? "#111827" : "rgba(255,255,255,0.92)",
                          }}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={saveInternalAssessment}
              disabled={saving}
              style={{
                cursor: saving ? "not-allowed" : "pointer",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #FEE000",
                background: "#FEE000",
                color: "#111827",
                fontWeight: 900,
              }}
            >
              {saving ? "Saving…" : "Save internal assessment (your 25 questions)"}
            </button>

            {!allAnswered && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                Tip: answer all 25 questions to save.
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
