"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

async function readJsonSafe(res, label) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} did not return JSON. Got: ${text.slice(0, 120)}`);
  }
}

export default function EmployeePulsePage() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [organisationId, setOrganisationId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        // ✅ GET USER + ORG FROM /api/me
        const meRes = await apiFetch("/api/me", { cache: "no-store" });
        const meJson = await readJsonSafe(meRes, "/api/me");

        if (cancelled) return;

        if (!meRes.ok) {
          throw new Error(meJson?.error || "Failed to load user profile");
        }

        const orgId = meJson?.organisation_id;

        if (!orgId) {
          throw new Error("No organisation linked to this employee.");
        }

        setOrganisationId(orgId);

        // ✅ LOAD QUESTIONS
        const res = await apiFetch("/api/pulse-questions", { cache: "no-store" });
        const json = await readJsonSafe(res, "/api/pulse-questions");

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load questions");
        }

        setQuestions(json?.questions || json || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => (cancelled = true);
  }, []);

  const total = questions.length;

  const answered = useMemo(() => {
    return questions.reduce((acc, q) => acc + (answers[q.id] ? 1 : 0), 0);
  }, [questions, answers]);

  const allAnswered = total > 0 && answered === total;

  async function handleSubmit() {
    try {
      setError(null);
      setSuccess(null);

      if (!allAnswered) throw new Error("Answer all questions");
      if (!organisationId) throw new Error("Missing organisation");

      setSubmitting(true);

      const payload = questions.map((q) => ({
        id: q.id,
        pillar: q.pillar,
        value: Number(answers[q.id]),
      }));

      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({
          organisation_id: organisationId,
          answers: payload,
        }),
      });

      const json = await readJsonSafe(res, "/api/employee-pulse");

      if (!res.ok) throw new Error(json?.error || "Submit failed");

      await apiFetch(`/api/calculate-hri?organisation_id=${organisationId}`);

      setSuccess("Pulse submitted successfully");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading…</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Employee Pulse</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.text}</p>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setAnswers({ ...answers, [q.id]: n })}>
              {n}
            </button>
          ))}
        </div>
      ))}

      <button disabled={!allAnswered || submitting} onClick={handleSubmit}>
        Submit
      </button>
    </div>
  );
}
