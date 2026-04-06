"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PublicPulseClient() {
  const searchParams = useSearchParams();
  const organisationId = searchParams.get("org");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/pulse-questions", { cache: "no-store" });
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load pulse questions");
        }

        setQuestions(data?.questions || []);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load pulse questions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestions();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!organisationId) return false;
    if (!questions.length) return false;
    return questions.every((q) => answers[q.id] != null && answers[q.id] !== "");
  }, [organisationId, questions, answers]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(value),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!organisationId) {
      setError("Missing organisation link.");
      return;
    }

    if (!canSubmit) {
      setError("Please answer all questions before submitting.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit pulse check");
      }

      setDone(true);
    } catch (e) {
      setError(e?.message || "Failed to submit pulse check");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
          Thank you
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5 }}>
          Your feedback has been submitted successfully.
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12 }}>
        Employee Pulse Check
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.5, marginBottom: 24 }}>
        Please answer honestly. Your responses are used to help build a clearer picture of workforce experience.
      </p>

      {!organisationId && (
        <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 16 }}>
          Missing organisation link. Please use the full pulse URL provided.
        </p>
      )}

      {error && (
        <p style={{ color: "#ef4444", fontWeight: 700, marginBottom: 16 }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading questions…</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: 20 }}>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 16,
                  padding: 16,
                  background: "rgba(255,255,255,.03)",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 12 }}>
                  {idx + 1}. {q.question_text || q.label || q.question || "Question"}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label
                      key={value}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,.12)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={value}
                        checked={answers[q.id] === value}
                        onChange={() => setAnswer(q.id, value)}
                      />
                      {value}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              disabled={!canSubmit || saving}
              style={{
                padding: "12px 18px",
                borderRadius: 12,
                fontWeight: 800,
                border: "none",
                cursor: canSubmit && !saving ? "pointer" : "not-allowed",
                opacity: canSubmit && !saving ? 1 : 0.6,
              }}
            >
              {saving ? "Submitting…" : "Submit pulse check"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
