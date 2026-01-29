"use client";

import { useEffect, useMemo, useState } from "react";

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [org, setOrg] = useState(null);
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

        // 1) Get org context (so we don't hardcode org IDs)
        const orgRes = await fetch("/api/me/org", { cache: "no-store" });
        const orgJson = await orgRes.json();
        if (!orgRes.ok || orgJson?.ok === false) {
          throw new Error(
            orgJson?.error || "Failed to load organisation context"
          );
        }
        setOrg(orgJson);

        // 2) Load pulse questions
        const qRes = await fetch("/api/pulse-questions", { cache: "no-store" });
        const qJson = await qRes.json();
        if (!qRes.ok || qJson?.ok === false) {
          throw new Error(qJson?.error || "Failed to load pulse questions");
        }

        // Your endpoint returns { ok:true, questions:[...] }
        setQuestions(Array.isArray(qJson.questions) ? qJson.questions : []);
      } catch (e) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = questions.length;

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter(
      (v) => Number(v) >= 1 && Number(v) <= 5
    ).length;
  }, [answers]);

  const allAnswered = total > 0 && answeredCount === total;

  // Map question_id -> q1..q10 based on question position (1..10)
  function buildQPayload() {
    const byPosition = {};
    for (const q of questions) {
      const pos = Number(q.position);
      if (!Number.isFinite(pos) || pos < 1 || pos > 10) continue;

      const val = Number(answers[q.id]);
      byPosition[`q${pos}`] = Number.isFinite(val) ? val : null;
    }
    return byPosition;
  }

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) {
        throw new Error(`Please answer all questions (${answeredCount}/${total}).`);
      }

      const organisation_id =
        org?.organisation_id || org?.organization_id || org?.org_id || null;

      if (!organisation_id) {
        throw new Error("Missing organisation_id from /api/me/org");
      }

      const payload = {
        organisation_id,
        responses: buildQPayload(), // { q1:5, q2:4, ... q10:5 }
      };

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to submit pulse.");
      }

      // ✅ FIX: your API returns { ok:true, submission:{ id:... } }
      const newId = json?.submission?.id || "unknown";
      setSuccess(`Saved ✅ Pulse ID: ${newId}`);

      // Optional reset after submit
      // setAnswers({});
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 16px 40px",
        color: "#E5E7EB",
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        Employee Pulse
      </h1>

      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Quick, anonymous pulse check across the five HRI pillars. Please answer
        each question from 1–5.
      </p>

      {loading && <p style={{ color: "#9CA3AF" }}>Loading pulse questions…</p>}

      {!loading && error && (
        <p style={{ color: "#F97316", marginBottom: 12 }}>{error}</p>
      )}
      {!loading && success && (
        <p style={{ color: "#34D399", marginBottom: 12 }}>{success}</p>
      )}

      {!loading && questions.length === 0 && (
        <p style={{ color: "#9CA3AF" }}>No pulse questions found.</p>
      )}

      {!loading && questions.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 12, color: "#9CA3AF" }}>
            Answered:{" "}
            <strong style={{ color: "#E5E7EB" }}>
              {answeredCount}/{total}
            </strong>
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
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#9CA3AF",
                  }}
                >
                  {q.pillar}
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: "#F9FAFB",
                    marginTop: 6,
                    marginBottom: 10,
                  }}
                >
                  {q.position}. {q.question_text}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = Number(answers[q.id]) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [q.id]: n }))
                        }
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
