"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/apiFetch";

export const dynamic = "force-dynamic";

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [orgId, setOrgId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setError("");

        // ✅ MUST include Bearer token
        const orgRes = await apiFetch("/api/me/org");
        const orgJson = await orgRes.json();

        if (!orgRes.ok || orgJson.ok === false) {
          throw new Error(orgJson?.error || "Failed to load org");
        }

        if (!orgJson.organisation_id) {
          throw new Error("Missing organisation_id from /api/me/org");
        }

        setOrgId(orgJson.organisation_id);

        // Questions
        const res = await apiFetch("/api/employee-questions");
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json?.error || "Failed to load employee questions");
        }

        setQuestions(Array.isArray(json.questions) ? json.questions : []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, []);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  }

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");

      if (!orgId) throw new Error("Missing organisation_id (org not loaded)");

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
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 className="pageTitle">Employee Pulse</h1>
      <p className="pageSub">Answer 10 questions. This writes a submission into pulse_check_submissions.</p>

      {error && (
        <div className="card" style={{ borderColor: "#ff6b6b" }}>
          <p style={{ margin: 0, color: "#ff6b6b" }}>Error: {error}</p>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button className="pill" onClick={submitPulse} disabled={submitting || !questions.length}>
          {submitting ? "Submitting…" : "Submit pulse"}
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
        {questions.map((q, idx) => (
          <div key={q.id} className="card">
            <div className="pageSub" style={{ marginTop: 0 }}>
              {q.pillar} • Q{q.position ?? idx + 1}
            </div>
            <div className="cardTitle" style={{ marginTop: 6 }}>
              {q.question_text ?? q.text ?? "—"}
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
    </main>
  );
}
