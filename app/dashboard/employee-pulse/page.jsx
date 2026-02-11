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
  const [orgId, setOrgId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: 1..5 }

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setDebug(null);

        // 1) Org context (protected)
        const orgRes = await apiFetch("/api/me/org");
        const orgJson = await orgRes.json().catch(() => null);

        if (!orgRes.ok || orgJson?.ok === false) {
          setDebug({ where: "org-load-failed", orgJson });
          throw new Error(orgJson?.error || "Failed to load /api/me/org");
        }

        if (!orgJson?.organisation_id) {
          setDebug({ where: "org-no-id", orgJson });
          throw new Error("No organisation_id found for this user");
        }

        setOrgId(orgJson.organisation_id);

        // 2) Questions
        const qRes = await apiFetch("/api/employee-questions");
        const qJson = await qRes.json().catch(() => null);

        if (!qRes.ok || qJson?.ok === false) {
          setDebug({ where: "questions-failed", qJson });
          throw new Error(qJson?.error || "Failed to load employee questions");
        }

        const qs = Array.isArray(qJson?.questions) ? qJson.questions : [];
        setQuestions(qs);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Failed to load.");
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

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  }

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");
      setDebug(null);

      if (!orgId) throw new Error("Org not loaded.");
      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      // ✅ IMPORTANT: your API expects "responses", not "answers"
      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({
          organisation_id: orgId,
          responses: answers,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.ok === false) {
        setDebug({ where: "submit-failed", status: res.status, json });
        throw new Error(json?.error || "Failed to submit pulse");
      }

      alert("Pulse submitted ✅");
      setAnswers({});
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to submit pulse");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 40px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Employee Pulse</h1>
      <p style={{ opacity: 0.75, marginBottom: 14 }}>Quick pulse. Real signals. No waffle.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <span style={pillStyle}>
          Org ID: <strong>{orgId || "—"}</strong>
        </span>
        <span style={pillStyle}>
          Answered: <strong>{answeredCount}/{total}</strong>
        </span>
        <span style={pillStyle}>
          Status: <strong>{loading ? "Loading…" : allAnswered ? "Ready ✅" : "In progress"}</strong>
        </span>
      </div>

      {error ? (
        <div style={errorBoxStyle}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {debug ? (
        <details style={{ margin: "12px 0" }}>
          <summary style={{ cursor: "pointer", opacity: 0.7 }}>Debug</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.85 }}>
            {JSON.stringify(debug, null, 2)}
          </pre>
        </details>
      ) : null}

      {loading ? (
        <p style={{ opacity: 0.75 }}>Loading questions…</p>
      ) : total === 0 ? (
        <p style={{ opacity: 0.75 }}>No questions found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {questions.map((q) => {
            const current = Number(answers[q.id] || 0);

            return (
              <div key={q.id} style={cardStyle}>
                <div style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7 }}>
                  {q.pillar || "Pulse"}
                </div>

                {/* ✅ LOCKED: this is the field your API should be returning */}
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>
                  {q.question_text}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                  {SCALE.map((s) => {
                    const active = current === s.v;
                    return (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setAnswer(q.id, s.v)}
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

          <button
            onClick={submitPulse}
            disabled={submitting || loading}
            style={{
              marginTop: 6,
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #FEE000",
              background: "#FEE000",
              color: "#111827",
              fontWeight: 900,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Submitting…" : "Submit Pulse"}
          </button>

          {!allAnswered ? (
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
              Tip: answer all questions to submit.
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}

const cardStyle = {
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 12,
  padding: 14,
  background: "rgba(0,0,0,0.25)",
};

const pillStyle = {
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 12,
  opacity: 0.9,
};

const errorBoxStyle = {
  margin: "12px 0",
  padding: 12,
  border: "1px solid #F97316",
  borderRadius: 10,
};
