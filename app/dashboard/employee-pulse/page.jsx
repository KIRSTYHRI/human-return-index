"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: 1..5 }

  // Load questions
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        const res = await apiFetch("/api/pulse-questions");
        const json = await res.json().catch(() => ({}));

        if (!res.ok) throw new Error(json?.error || "Failed to load pulse questions");

        const qs = json?.questions || json || [];
        if (!Array.isArray(qs)) throw new Error("Questions response not in expected format");

        if (!cancelled) setQuestions(qs);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalQuestions = questions.length;

  const answeredCount = useMemo(() => {
    if (!totalQuestions) return 0;
    return questions.reduce((acc, q) => acc + (answers[q.id] ? 1 : 0), 0);
  }, [questions, answers, totalQuestions]);

  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!allAnswered) {
        throw new Error("Please answer all questions before submitting.");
      }

      // 1) Get organisation_id from cookie/session-auth endpoint
      const orgRes = await apiFetch("/api/me/org");
      const orgJson = await orgRes.json().catch(() => ({}));

      if (!orgRes.ok) {
        throw new Error(orgJson?.error || "Could not load organisation (are you logged in?)");
      }

      const organisation_id = orgJson?.organisation_id;
      if (!organisation_id) {
        throw new Error("Missing organisation_id (me/org did not return one)");
      }

      // 2) Convert answers into the shape the API expects
      // If your API expects a different shape, tell me and I’ll match it.
      const payloadAnswers = questions.map((q) => ({
        question_id: q.id,
        score: Number(answers[q.id]),
      }));

      // 3) Submit pulse
      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({
          organisation_id,
          answers: payloadAnswers,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to submit pulse");

      setSuccess("Pulse saved ✅");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Employee Pulse</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Quick pulse check (1–5). This saves anonymously at org level.
      </p>

      {loading && <p>Loading…</p>}

      {!loading && error && (
        <div style={{ padding: 12, border: "1px solid #f00", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && success && (
        <div style={{ padding: 12, border: "1px solid #0a0", marginBottom: 12 }}>
          {success}
        </div>
      )}

      {!loading && (
        <div style={{ marginBottom: 12, opacity: 0.85 }}>
          <strong>
            {answeredCount} of {totalQuestions} questions answered.
          </strong>
          {!allAnswered && totalQuestions > 0 && (
            <span style={{ marginLeft: 8 }}>Finish all to submit.</span>
          )}
        </div>
      )}

      {!loading && totalQuestions === 0 && (
        <p>No questions found. Check `/api/pulse-questions` response.</p>
      )}

      {!loading && totalQuestions > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8 }}>
                {idx + 1}. {q.text || q.question || q.label || "Question"}
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((n) => {
                  const active = Number(answers[q.id]) === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(q.id, n)}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        border: "1px solid #aaa",
                        cursor: "pointer",
                        fontWeight: 700,
                        opacity: active ? 1 : 0.7,
                      }}
                      aria-pressed={active}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid #000",
                cursor: !allAnswered || submitting ? "not-allowed" : "pointer",
                fontWeight: 800,
                opacity: !allAnswered || submitting ? 0.5 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Submit Pulse"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
