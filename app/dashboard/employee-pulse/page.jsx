"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/apiFetch";

export const dynamic = "force-dynamic";

const SCALE = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
];

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

        // 1) Get org (requires bearer token) -> must use apiFetch
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

        // 2) Load pulse questions (DB-backed in your new routes)
        const qRes = await apiFetch("/api/employee-questions");
        const qJson = await qRes.json().catch(() => null);

        if (!qRes.ok || qJson?.ok === false) {
          setDebug({ where: "questions-failed", qJson });
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
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questionsCount > 0 && answeredCount === questionsCount;

  const orderedQuestions = useMemo(() => {
    // stable ordering: pillar then position
    return [...questions].sort((a, b) => {
      const pa = (a.pillar || "").toString();
      const pb = (b.pillar || "").toString();
      if (pa !== pb) return pa.localeCompare(pb);
      return (a.position ?? 0) - (b.position ?? 0);
    });
  }, [questions]);

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");

      if (!orgId) throw new Error("Missing organisation_id (org not loaded).");
      if (!questionsCount) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error("Please answer all questions before submitting.");

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
      <p className="pageSub" style={{ marginTop: 6 }}>
        Answer {questionsCount || 10} questions. This writes a submission into pulse_check_submissions.
      </p>

      {error && (
        <div className="card" style={{ borderColor: "#ff6b6b" }}>
          <p style={{ margin: 0, color: "#ff6b6b" }}>{error}</p>
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="pill"
          onClick={submitPulse}
          disabled={loading || submitting || !questionsCount || !allAnswered}
          style={{
            opacity: loading || submitting || !questionsCount || !allAnswered ? 0.6 : 1,
            cursor: loading || submitting || !questionsCount || !allAnswered ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : "Submit pulse"}
        </button>

        <span className="pageSub" style={{ margin: 0 }}>
          {loading ? "Loading…" : `${answeredCount}/${questionsCount} answered`}
        </span>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {orderedQuestions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="pageSub" style={{ marginTop: 0 }}>
              {q.pillar} • Q{q.position ?? idx + 1}
            </div>

            <div className="cardTitle" style={{ marginTop: 6 }}>
              {q.question_text ?? q.text ?? q.question ?? "—"}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
              {SCALE.map((opt) => (
                <label
                  key={opt.value}
                  className="pill"
                  style={{
                    cursor: "pointer",
                    borderColor: answers[q.id] === opt.value ? "#FACC15" : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={opt.value}
                    checked={answers[q.id] === opt.value}
                    onChange={() => setAnswer(q.id, opt.value)}
                    style={{ marginRight: 8, cursor: "pointer" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Debug panel */}
      <div style={{ marginTop: 18 }}>
        <div className="pageSub" style={{ marginBottom: 6 }}>
          Debug panel
        </div>
        <pre className="card" style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(
  {
    debug,
    orgId,
    answers,
    questionsCount,
    answeredCount,
  },
  null,
  2
)}
        </pre>
      </div>
    </main>
  );
}
