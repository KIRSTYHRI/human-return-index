"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "..
import { apiFetch } from "../../../lib/apiFetch";

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

        // ✅ MUST include Bearer token, so use apiFetch
        const orgRes = await apiFetch("/api/me/org");
        const orgJson = await orgRes.json().catch(() => null);

        if (!orgRes.ok || orgJson?.ok === false) {
          setDebug({ where: "org-missing", orgJson });
          throw new Error(orgJson?.error || "Failed to load /api/me/org");
        }

        if (!orgJson?.organisation_id) {
          setDebug({ where: "org-no-id", orgJson });
          throw new Error("Missing organisation_id from /api/me/org (see debug).");
        }

        setOrgId(orgJson.organisation_id);

        const qRes = await apiFetch("/api/employee-questions");
        const qJson = await qRes.json().catch(() => null);

        if (!qRes.ok || qJson?.ok === false) {
          throw new Error(qJson?.error || "Failed to load employee questions");
        }

        const items = Array.isArray(qJson?.questions) ? qJson.questions : [];
        setQuestions(items);
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

      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organisation_id: orgId,
          answers,
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

  return (
    <main style={{ padding: 24 }}>
      <h1 className="pageTitle">Employee Pulse</h1>
      <p className="pageSub">
        Answer 10 questions. This writes a submission into pulse_check_submissions.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "#ff6b6b" }}>
          <p style={{ margin: 0, color: "#ff6b6b" }}>{error}</p>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center" }}>
        <button className="pill" onClick={submitPulse} disabled={loading || submitting || !questionsCount}>
          {submitting ? "Submitting…" : "Submit pulse"}
        </button>
        <span className="pageSub" style={{ margin: 0 }}>
          {loading ? "Loading…" : `${questionsCount} questions`}
        </span>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="pageSub" style={{ marginTop: 0 }}>
              {q.pillar} • Q{q.position ?? idx + 1}
            </div>
            <div className="cardTitle" style={{ marginTop: 6 }}>
              {q.question_text ?? q.text ?? q.question ?? "—"}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <label key={v} className="pill" style={{ cursor: "pointer" }}>
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={v}
                    checked={answers[q.id] === v}
                    onChange={() => setAnswer(q.id, v)}
                    style={{ marginRight: 8 }}
                  />
                  {v}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <details className="card">
          <summary className="pill" style={{ cursor: "pointer", width: "fit-content" }}>
            Debug panel
          </summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>
{JSON.stringify(
  {
    debug,
    answers,
    questionsCount,
  },
  null,
  2
)}
          </pre>
        </details>
      </div>
    </main>
  );
}
