"use client";

import { useEffect, useMemo, useState } from "react";

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [question_id]: 1..5 }
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch("/api/pulse-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json?.error || "Failed to load pulse questions");
        }

        setQuestions(Array.isArray(json.questions) ? json.questions : []);
      } catch (e) {
        setError(e.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = questions.length;
  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => Number(v) >= 1 && Number(v) <= 5).length,
    [answers]
  );
  const allAnswered = total > 0 && answeredCount === total;

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      const payload = {
  organisation_id: "9499b1b9-7fce-43a1-9590-d533f00dc71d", // your org id
  responses: questions.map((q) => ({
    question_id: q.id,
    response_value: Number(answers[q.id]),
  })),
};

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        throw new Error(json?.error || "Failed to submit pulse.");
      }

      setSuccess(`Saved ✅ Pulse ID: ${json.pulse_id}`);
    } catch (e) {
      setError(e.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Employee Pulse</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Quick, anonymous pulse check across the five HRI pillars. Please answer each question from 1–5.
      </p>

      {loading && <p style={{ color: "#9CA3AF" }}>Loading pulse questions…</p>}

      {!loading && error && (
        <p style={{ color: "#F97316", marginBottom: 12 }}>
          {error}
        </p>
      )}

      {!loading && success && (
        <p style={{ color: "#34D399", marginBottom: 12 }}>
          {success}
        </p>
      )}

      {!loading && !error && questions.length === 0 && (
        <p style={{ color: "#9CA3AF" }}>No pulse questions found.</p>
      )}

      {!loading && questions.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 12, color: "#9CA3AF" }}>
            Answered: <strong style={{ color: "#E5E7EB" }}>{answeredCount}/{total}</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  border: "1px solid #1F2937",
                  borderRadius: 12,
                  padding: 14,
                  background:
                    "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  {q.pillar}
                </div>
                <div style={{ fontSize: 14, color: "#F9FAFB", marginTop: 6, marginBottom: 10 }}>
                  {q.question_text}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = Number(answers[q.id]) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
                        style={{
                          cursor: "pointer",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #374151",
                          background: active ? "#FEE000" : "transparent",
                          color: active ? "#111827" : "#E5E7EB",
                          fontWeight: 700,
                          minWidth: 44,
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              onClick={submitPulse}
              disabled={submitting}
              style={{
                cursor: submitting ? "not-allowed" : "pointer",
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid #FEE000",
                background: "#FEE000",
                color: "#111827",
                fontWeight: 800,
              }}
            >
              {submitting ? "Submitting…" : "Submit pulse response"}
            </button>

            {!allAnswered && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
                Tip: you need to answer all questions before submitting.
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
