"use client";

import { useEffect, useMemo, useState } from "react";

const VERSION = "EMPLOYEE_PULSE_PAGE_V4__READ_PULSE_ID__DEBUG_PANEL";

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debug, setDebug] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [employeeEmail, setEmployeeEmail] = useState("");

  const answeredCount = useMemo(() => Object.keys(answers || {}).length, [answers]);
  const total = questions.length;
  const allAnswered = total > 0 && answeredCount === total;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch("/api/employee-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load employee questions.");

        setQuestions(json.questions || []);
      } catch (e) {
        setError(e?.message || "Failed to load questions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...(prev || {}), [questionId]: value }));
  }

  function buildQPayload() {
    const byPosition = {};
    for (const q of questions) {
      const v = answers?.[q.id];
      if (v != null) byPosition[q.position] = v;
    }
    const out = {};
    for (let i = 1; i <= 10; i++) out[`q${i}`] = byPosition[i] ?? null;
    return out;
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      const orgRes = await fetch("/api/me/org", { cache: "no-store" });
      const orgJson = await orgRes.json().catch(() => ({}));
      const org = orgJson?.org || orgJson;

      const organisation_id =
        org?.organisation_id || org?.organization_id || org?.organisationId || org?.org_id || null;

      if (!organisation_id) {
        setDebug({ where: "org-missing", orgJson });
        throw new Error("Missing organisation_id from /api/me/org (see debug).");
      }

      const payload = {
        organisation_id,
        employee_email: employeeEmail || null,
        responses: buildQPayload(),
      };

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      setDebug({ where: "employee-pulse-response", status: res.status, json, version: VERSION });

      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Failed to submit pulse.");

      const newId = json?.pulse_id || json?.submission?.id || null;
      if (!newId) throw new Error("Pulse saved but no ID returned (check debug).");

      setSuccess(`Saved ✅ Pulse ID: ${newId}`);
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Employee Pulse</h1>
        <div style={{ opacity: 0.8 }}>Loading…</div>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
        Employee Pulse <span style={{ fontSize: 12, opacity: 0.6 }}>({VERSION})</span>
      </h1>

      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Answer {total} questions. This writes a submission into <code>pulse_check_submissions</code>.
      </p>

      {error && (
        <div style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          <strong style={{ color: "#FCA5A5" }}>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", padding: 12, borderRadius: 10, marginBottom: 12 }}>
          <strong style={{ color: "#86EFAC" }}>{success}</strong>
        </div>
      )}

      <div style={{ marginBottom: 14, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={employeeEmail}
          onChange={(e) => setEmployeeEmail(e.target.value)}
          placeholder="Employee email (optional)"
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(0,0,0,0.35)",
            color: "white",
            minWidth: 260,
          }}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting || !allAnswered}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            background: submitting || !allAnswered ? "#374151" : "#FEE000",
            color: submitting || !allAnswered ? "#9CA3AF" : "#111827",
            fontWeight: 800,
            cursor: submitting || !allAnswered ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : allAnswered ? "Submit pulse" : `Answer all (${answeredCount}/${total})`}
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {(questions || []).map((q) => (
          <div key={q.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 14, background: "rgba(0,0,0,0.25)" }}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
              {q.pillar} • Q{q.position}
            </div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>{q.question_text}</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setAnswer(q.id, v)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: answers?.[q.id] === v ? "#FEE000" : "rgba(0,0,0,0.25)",
                    color: answers?.[q.id] === v ? "#111827" : "#E5E7EB",
                    fontWeight: 700,
                    cursor: "pointer",
                    minWidth: 40,
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <details style={{ marginTop: 18, opacity: 0.9 }}>
        <summary style={{ cursor: "pointer" }}>Debug panel</summary>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, padding: 12, background: "rgba(0,0,0,0.35)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
          {JSON.stringify({ debug, answers, questionsCount: questions.length }, null, 2)}
        </pre>
      </details>
    </main>
  );
}
