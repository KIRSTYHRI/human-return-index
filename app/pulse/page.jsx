"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

async function readJsonSafe(res: Response, label: string) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} did not return JSON. Got: ${text.slice(0, 120)}`);
  }
}

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [organisationId, setOrganisationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPulse() {
      try {
        setLoading(true);
        setError(null);

        // IMPORTANT: your working route is /api/me/org
        const meRes = await apiFetch("/api/me/org", { cache: "no-store" });
        const meJson = await readJsonSafe(meRes, "/api/me/org");

        if (cancelled) return;

        if (!meRes.ok) {
          throw new Error(meJson?.error || "Failed to load employee organisation.");
        }

        const orgId = meJson?.organisation_id;

        if (!orgId) {
          throw new Error("Missing organisation link. Please contact your employer.");
        }

        setOrganisationId(orgId);

        const questionsRes = await apiFetch("/api/pulse-questions", {
          cache: "no-store",
        });

        const questionsJson = await readJsonSafe(
          questionsRes,
          "/api/pulse-questions"
        );

        if (cancelled) return;

        if (!questionsRes.ok) {
          throw new Error(questionsJson?.error || "Failed to load pulse questions.");
        }

        const loadedQuestions = questionsJson?.questions || questionsJson || [];

        if (!Array.isArray(loadedQuestions)) {
          throw new Error("Pulse questions response is not in the expected format.");
        }

        setQuestions(loadedQuestions);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load pulse page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPulse();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalQuestions = questions.length;

  const answeredCount = useMemo(() => {
    return questions.reduce((count, question) => {
      return answers[question.id] ? count + 1 : count;
    }, 0);
  }, [questions, answers]);

  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      if (!organisationId) {
        throw new Error("Missing organisation link. Please contact your employer.");
      }

      if (!allAnswered) {
        throw new Error("Please answer all questions before submitting.");
      }

      const payloadAnswers = questions.map((question) => ({
        id: question.id,
        pillar: question.pillar,
        value: Number(answers[question.id]),
      }));

      const pulseRes = await apiFetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({
          organisation_id: organisationId,
          answers: payloadAnswers,
        }),
      });

      const pulseJson = await readJsonSafe(pulseRes, "/api/employee-pulse");

      if (!pulseRes.ok) {
        throw new Error(pulseJson?.error || "Pulse submission failed.");
      }

      const calcRes = await apiFetch(
        `/api/calculate-hri?organisation_id=${encodeURIComponent(
          organisationId
        )}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const calcJson = await readJsonSafe(calcRes, "/api/calculate-hri");

      if (!calcRes.ok) {
        throw new Error(
          calcJson?.error || "Pulse saved, but HRI recalculation failed."
        );
      }

      setSuccess("Pulse submitted successfully. The company HRI score has been updated.");
    } catch (err: any) {
      setError(err?.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading employee pulse…</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: 6 }}>Employee Pulse</h1>

      <p style={{ opacity: 0.85, marginTop: 0 }}>
        Quick pulse check to understand how your people are doing right now.
      </p>

      {error && <p style={{ color: "red", fontWeight: 700 }}>{error}</p>}

      {success && (
        <p style={{ color: "green", fontWeight: 700 }}>{success}</p>
      )}

      {organisationId && (
        <p style={{ opacity: 0.65, fontSize: 12 }}>
          Organisation ID: {organisationId}
        </p>
      )}

      {questions.length === 0 && !error && (
        <p>No pulse questions found.</p>
      )}

      {questions.length > 0 && (
        <>
          <p style={{ opacity: 0.8 }}>
            {answeredCount} of {totalQuestions} answered
          </p>

          <div style={{ display: "grid", gap: 16 }}>
            {questions.map((question, index) => (
              <div
                key={question.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <p style={{ fontWeight: 700, marginBottom: 6 }}>
                  Q{index + 1}: {question.pillar || "Pulse"}
                </p>

                <p>{question.text}</p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((score) => {
                    const selected = answers[question.id] === score;

                    return (
                      <button
                        key={score}
                        type="button"
                        onClick={() =>
                          setAnswers((previous) => ({
                            ...previous,
                            [question.id]: score,
                          }))
                        }
                        style={{
                          minWidth: 44,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: selected
                            ? "2px solid var(--yellow)"
                            : "1px solid rgba(255,255,255,0.25)",
                          background: selected ? "var(--yellow)" : "transparent",
                          color: selected ? "black" : "inherit",
                          fontWeight: selected ? 800 : 500,
                          cursor: "pointer",
                        }}
                      >
                        {score}
                      </button>
                    );
                  })}
                </div>

                <p style={{ opacity: 0.65, fontSize: 12 }}>
                  1 = strongly disagree · 5 = strongly agree
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !allAnswered || !organisationId}
            style={{
              marginTop: 20,
              padding: "12px 18px",
              borderRadius: 12,
              border: "none",
              background: allAnswered && organisationId ? "var(--yellow)" : "#777",
              color: "black",
              fontWeight: 800,
              cursor: allAnswered && organisationId ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Submitting…" : "Submit employee pulse"}
          </button>
        </>
      )}
    </div>
  );
}
