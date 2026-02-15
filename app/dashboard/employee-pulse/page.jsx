"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../src/lib/apiFetch";

export const dynamic = "force-dynamic";

const SCALE = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch("/api/employee-questions", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Failed to load employee questions");
        }

        const qs = Array.isArray(json.questions) ? json.questions : [];
        setQuestions(qs);
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

  function setAnswer(qid, val) {
    setAnswers((prev) => ({ ...prev, [qid]: Number(val) }));
  }

  async function submitPulse() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({ responses: answers }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to submit pulse.");
      }

      setSuccess("Submitted ✅ Thanks — pulse saved.");
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Employee Pulse</h1>

      <p style={{ opacity: 0.75, marginBottom: 18 }}>
        Quick pulse check (1–5). This saves anonymously at org level.
      </p>

      {loading && <p style={{ opacity: 0.75 }}>Loading employee questions…</p>}
      {!loading && error && <p style={{ color: "#F97316", marginBottom: 12 }}>{error}</p>}
      {!loading && success && <p style={{ color: "#34D399", marginBottom: 12 }}>{success}</p>}

      {!loading && (
        <div style={{ marginBottom: 14, fontSize: 13, opacity: 0.8 }}>
          {answeredCount} of {total} questions answered.
        </div>
      )}

      {!loading && total === 0 && <p style={{ opacity: 0.75 }}>No employee questions found.</p>}

      {!loading && total > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {questions.map((q, idx) => {
              const id = q.id || `q${idx + 1}`;
              const current = Number(answers[id] || 0);

              return (
                <div
                  key={id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: 14,
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 650 }}>
                    {idx + 1}. {q.question_text}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                    {SCALE.map((s) => {
                      const active = current === s.v;
                      return (
                        <button
                          key={s.v}
                          type="button"
                          onClick={() => setAnswer(id, s.v)}
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
              onClick={submitPulse}
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
              {saving ? "Submitting…" : "Submit pulse"}
            </button>

            {!allAnswered && (
              <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
                Tip: answer all questions to submit.
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
