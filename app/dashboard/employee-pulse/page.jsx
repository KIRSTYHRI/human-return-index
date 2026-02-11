"use client";

import { useEffect, useState } from "react";

// ✅ Adjust this import depending on where your apiFetch file actually is:
// If your apiFetch is at: src/lib/apiFetch.js  -> use "@/src/lib/apiFetch" (if alias works)
// If you don't have alias set up, use the relative path I give below.

// OPTION A (preferred if your project supports "@/"):
// import { apiFetch } from "@/src/lib/apiFetch";

// OPTION B (most likely for you right now):
import { apiFetch } from "../../../src/lib/apiFetch";

export const dynamic = "force-dynamic";

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [orgId, setOrgId] = useState(null);

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

        // 1) Load org (protected route)
        const orgRes = await apiFetch("/api/me/org");
        const orgJson = await orgRes.json().catch(() => null);

        if (!orgRes.ok || orgJson?.ok === false) {
          setDebug({ where: "org-load-failed", orgJson });
          throw new Error(orgJson?.error || "Failed to load /api/me/org");
        }

        // Expecting: { organisation_id: "..." }
        if (!orgJson?.organisation_id) {
          setDebug({ where: "org-no-id", orgJson });
          throw new Error("Missing organisation_id from /api/me/org");
        }

        setOrgId(orgJson.organisation_id);

        // 2) Load employee pulse questions (can be public but apiFetch is fine)
        const qRes = await apiFetch("/api/employee-questions");
        const qJson = await qRes.json().catch(() => null);

        if (!qRes.ok || qJson?.ok === false) {
          setDebug({ where: "questions-failed", qJson });
          throw new Error(qJson?.error || "Failed to load employee questions");
        }

        setQuestions(Array.isArray(qJson?.questions) ? qJson.questions : []);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  }

  const questionsCount = questions.length;

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");

      if (!orgId) throw new Error("Missing organisation_id (org not loaded).");
      if (!questionsCount) throw new Error("No questions loaded.");

      // Optional: simple completeness check
      const answeredCount = Object.keys(answers).length;
      if (answeredCount < questionsCount) {
        throw new Error(`Please answer all questions (${answeredCount}/${questionsCount})`);
      }

      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({
          organisation_id: orgId,
          answers, // object: { question_id: 1-5, ... }
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.ok === false)) {
        throw new Error((json && json.error) || "Failed to submit pulse");
      }

      alert("Pulse submitted ✅");
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to submit pulse");
    } finally {
      setSubmitting(false);
    }
  }

  // --- UI ---
  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Employee Pulse</h1>
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 860 }}>
      <h1>Employee Pulse</h1>

      {error ? (
        <div style={{ margin: "12px 0", padding: 12, border: "1px solid #f00", borderRadius: 8 }}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {debug ? (
        <div style={{ margin: "12px 0" }}>
          <h3>Debug</h3>
          <pre style={{ background: "#111", color: "#0f0", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      ) : null}

      <p style={{ opacity: 0.8 }}>
        Org ID: <strong>{orgId || "—"}</strong>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q) => (
          <div key={q.id} style={{ border: "1px solid #ddd", borderRadius: 10, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>{q.question_text}</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <label key={v} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={v}
                    checked={answers[q.id] === v}
                    onChange={() => setAnswer(q.id, v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={submitPulse}
        disabled={submitting || questionsCount === 0}
        style={{
          marginTop: 16,
          padding: "10px 14px",
          borderRadius: 10,
          border: "none",
          cursor: submitting ? "not-allowed" : "pointer",
        }}
      >
        {submitting ? "Submitting…" : "Submit Pulse"}
      </button>
    </div>
  );
}

 
