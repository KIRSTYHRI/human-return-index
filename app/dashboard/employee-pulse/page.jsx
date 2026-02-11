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
  const [responses, setResponses] = useState({}); // { [questionId]: 1..5 }

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

        // 1) Org context
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
          setDebug({ where: "questions-load-failed", qJson });
          throw new Error(qJson?.error || "Failed to load employee questions");
        }

        setQuestions(Array.isArray(qJson?.questions) ? qJson.questions : []);
      } catch (e) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = questions.length;

  const answeredCount = useMemo(() => {
    return Object.values(responses).filter((v) => Number(v) >= 1 && Number(v) <= 5).length;
  }, [responses]);

  const allAnswered = total > 0 && answeredCount === total;

  function setResponse(questionId, value) {
    setResponses((prev) => ({ ...prev, [questionId]: Number(value) }));
  }

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");
      setDebug(null);

      if (!orgId) throw new Error("Org not loaded.");
      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      // ✅ IMPORTANT: backend expects "responses"
      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: orgId,
          responses,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.ok === false) {
        setDebug({ where: "submit-failed", status: res.status, json });
        throw new Error(json?.error || "Failed to submit pulse");
      }

      alert("Pulse submitted ✅");
      setResponses({});
    } catch (e) {
      setError(e?.message || "Failed to submit pulse");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "28px 16px 44px" }}>
      <div style={wrap}>
        <h1 style={h1}>Employee Pulse</h1>
        <p style={sub}>Quick pulse. Real signals. No fluff.</p>

        <div style={row}>
          <span style={pill}>
            Org: <strong style={{ color: "#FEE000" }}>{orgId || "—"}</strong>
          </span>
          <span style={pill}>
            Answered: <strong style={{ color: "#FEE000" }}>{answeredCount}/{total}</strong>
          </span>
          <span style={pill}>
            Status:{" "}
            <strong style={{ color: "#FEE000" }}>
              {loading ? "Loading…" : allAnswered ? "Ready ✅" : "In progress"}
            </strong>
          </span>
        </div>

        {error ? <div style={errorBox}><strong>Error:</strong> {error}</div> : null}

        {debug ? (
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: "pointer", opacity: 0.8 }}>Debug</summary>
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, opacity: 0.85 }}>
              {JSON.stringify(debug, null, 2)}
            </pre>
          </details>
        ) : null}

        {loading ? (
          <p style={{ opacity: 0.8, marginTop: 14 }}>Loading questions…</p>
        ) : total === 0 ? (
          <p style={{ opacity: 0.8, marginTop: 14 }}>No questions found.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            {questions.map((q) => {
              const current = Number(responses[q.id] || 0);

              return (
                <div key={q.id} style={card}>
                  <div style={pillSmall}>{q.pillar || "Pulse"}</div>
                  <div style={qText}>{q.question_text}</div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                    {SCALE.map((s) => {
                      const active = current === s.v;
                      return (
                        <button
                          key={s.v}
                          type="button"
                          onClick={() => setResponse(q.id, s.v)}
                          style={{
                            cursor: "pointer",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.18)",
                            padding: "10px 12px",
                            fontWeight: 900,
                            background: active ? "#FEE000" : "transparent",
                            color: active ? "#111827" : "rgba(255,255,255,0.92)",
                          }}
                        >
                          {s.v}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 8, fontSize: 12, opacity: 0.75 }}>
                    1 = Strongly disagree · 5 = Strongly agree
                  </div>
                </div>
              );
            })}

            <button type="button" onClick={submitPulse} disabled={submitting} style={cta(submitting)}>
              {submitting ? "Submitting…" : "Submit Pulse"}
            </button>

            {!allAnswered ? (
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Tip: answer all questions to submit.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}

const wrap = {
  background: "#0b0b0b",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 18,
  padding: 18,
};

const h1 = { fontSize: 26, fontWeight: 950, color: "#fff", margin: 0 };
const sub = { color: "rgba(255,255,255,0.72)", marginTop: 6, marginBottom: 14 };

const row = { display: "flex", gap: 10, flexWrap: "wrap" };

const pill = {
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999,
  padding: "8px 10px",
  fontSize: 12,
  color: "rgba(255,255,255,0.85)",
  background: "rgba(255,255,255,0.03)",
};

const pillSmall = {
  display: "inline-block",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 11,
  color: "rgba(255,255,255,0.85)",
  background: "rgba(255,255,255,0.03)",
};

const card = {
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
  padding: 14,
  background: "rgba(0,0,0,0.35)",
};

const qText = { color: "#fff", fontSize: 15, fontWeight: 800, marginTop: 8 };

const errorBox = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #F97316",
  color: "#fff",
};

const cta = (disabled) => ({
  marginTop: 6,
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #FEE000",
  background: "#FEE000",
  color: "#111827",
  fontWeight: 950,
  cursor: disabled ? "not-allowed" : "pointer",
});
