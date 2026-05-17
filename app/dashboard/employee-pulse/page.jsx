"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import LogoutButton from "../../components/LogoutButton";

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

        const overviewRes = await apiFetch("/api/overview", { cache: "no-store" });
        const overviewJson = await readJsonSafe(overviewRes, "/api/overview");

        if (cancelled) return;

        if (!overviewRes.ok) {
          throw new Error(overviewJson?.error || "Failed to load organisation from overview");
        }

        const orgId = overviewJson?.organisation_id || null;

        if (!orgId) {
          throw new Error("No organisation_id returned from /api/overview");
        }

        setOrganisationId(orgId);

        const res = await apiFetch("/api/pulse-questions", { cache: "no-store" });
        const json = await readJsonSafe(res, "/api/pulse-questions");

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load pulse questions");
        }

        const qs = json?.questions || json || [];
        if (!Array.isArray(qs)) {
          throw new Error("Questions response not in expected format");
        }

        setQuestions(qs);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load questions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalQuestions = questions.length;

  const answeredCount = useMemo(() => {
    if (!totalQuestions) return 0;
    return questions.reduce((acc, q) => acc + (answers[q.id] ? 1 : 0), 0);
  }, [questions, answers, totalQuestions]);

  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  async function handleSubmit() {
    try {
      setError(null);
      setSuccess(null);

      if (!totalQuestions) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error("Please answer all questions before submitting.");
      if (!organisationId) throw new Error("Missing organisation_id for this pulse submission.");

      setSubmitting(true);

      const payloadAnswers = questions.map((q) => ({
        id: q.id,
        pillar: q.pillar,
        value: Number(answers[q.id]),
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
        throw new Error(pulseJson?.error || "Pulse submission failed");
      }

      const calcRes = await apiFetch(
        `/api/calculate-hri?organisation_id=${encodeURIComponent(organisationId)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const calcJson = await readJsonSafe(calcRes, "/api/calculate-hri");

      if (!calcRes.ok) {
        throw new Error(calcJson?.error || "Pulse saved, but HRI recalculation failed.");
      }

      setSuccess("Pulse submitted and HRI score updated.");
      setError(null);
    } catch (e) {
      setError(e?.message || "Submission failed.");
      setSuccess(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <LogoutButton />
      </div>

      <h1 style={{ marginBottom: 6 }}>Employee Pulse</h1>
      <p style={{ opacity: 0.85, marginTop: 0 }}>
        Quick pulse check to understand how your people are doing right now.
      </p>

      {!loading && organisationId && (
        <p style={{ opacity: 0.7, fontSize: 12, marginTop: 0 }}>
          Organisation ID: {organisationId}
        </p>
      )}

      {loading && <p style={{ opacity: 0.75 }}>Loading pulse questions…</p>}

      {!loading && error && <p className="errorText">{error}</p>}
      {!loading && success && <p style={{ color: "var(--yellow)", fontWeight: 700 }}>{success}</p>}

      {!loading && totalQuestions === 0 && (
        <p>No questions found. Check `/api/pulse-questions` response.</p>
      )}

      {!loading && totalQuestions > 0 && (
        <>
          <div style={{ marginTop: 14, marginBottom: 14 }}>
            <span className="chip chipLive">
              {answeredCount} of {totalQuestions} answered
            </span>
            {!allAnswered && totalQuestions > 0 && (
              <span style={{ marginLeft: 10, opacity: 0.8 }}>
                Answer all questions to submit.
              </span>
            )}
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {questions.map((q, idx) => (
              <div key={q.id} className="panel">
                <div className="panelHeader">
                  <div className="panelTitle">{q.pillar || "PILLAR"}</div>
                  <div className="panelMeta">Q{idx + 1}</div>
                </div>

                <div style={{ marginTop: 10, fontSize: 16, fontWeight: 650 }}>
                  {q.text}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = Number(answers[q.id]) === n;

                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
                        aria-pressed={active}
                        className="btn"
                        style={{
                          minWidth: 46,
                          padding: "10px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,.15)",
                          opacity: active ? 1 : 0.75,
                          background: active ? "var(--yellow)" : "transparent",
                          color: active ? "var(--yellowText)" : "inherit",
                          borderColor: active ? "var(--yellow)" : "rgba(255,255,255,.15)",
                          boxShadow: active ? "0 0 0 3px rgba(254,224,0,.15)" : "none",
                        }}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
                  1 = strongly disagree · 5 = strongly agree
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
            <button
              className="btnPrimary"
              onClick={handleSubmit}
              disabled={submitting || !allAnswered || !organisationId}
            >
              {submitting ? "Submitting…" : "Submit employee pulse"}
            </button>

            {!allAnswered && (
              <span style={{ opacity: 0.75 }}>
                Tip: answer all questions to submit.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
