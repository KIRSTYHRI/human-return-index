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

  // ✅ Always resolve organisation_id no matter the response shape
  function resolveOrganisationId(orgJson) {
    return (
      orgJson?.organisation_id ||
      orgJson?.organization_id ||
      orgJson?.org_id ||
      orgJson?.org?.organisation_id ||
      orgJson?.org?.organization_id ||
      orgJson?.org?.org_id ||
      orgJson?.data?.organisation_id ||
      orgJson?.data?.organization_id ||
      orgJson?.data?.org_id ||
      orgJson?.organisation?.id ||
      orgJson?.organization?.id ||
      null
    );
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        // 1) Get org context
        const orgRes = await fetch("/api/me/org", { cache: "no-store" });
        let orgJson = null;
        try {
          orgJson = await orgRes.json();
        } catch {
          orgJson = null;
        }

        if (!orgRes.ok || orgJson?.ok === false) {
          throw new Error(orgJson?.error || `Failed to load organisation context (HTTP ${orgRes.status})`);
        }

        const organisation_id = resolveOrganisationId(orgJson);
        if (!organisation_id) {
          throw new Error(
            `Organisation context loaded but no organisation_id found.\n\nResponse:\n${JSON.stringify(orgJson, null, 2)}`
          );
        }

        // Store a clean shape so the rest of the page is predictable
        setOrg({ organisation_id, raw: orgJson });

        // 2) Load pulse questions
        const qRes = await fetch("/api/pulse-questions", { cache: "no-store" });
        const qJson = await qRes.json();

        if (!qRes.ok || qJson?.ok === false) {
          throw new Error(qJson?.error || "Failed to load pulse questions");
        }

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
    return Object.values(answers).filter((v) => Number(v) >= 1 && Number(v) <= 5).length;
  }, [answers]);

  const allAnswered = total > 0 && answeredCount === total;

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
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      const organisation_id = org?.organisation_id || null;
      if (!organisation_id) throw new Error("Missing organisation_id (org context not loaded)");

      const payload = { organisation_id, responses: buildQPayload() };

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let json = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || `Failed to submit pulse (HTTP ${res.status})`);
      }

      const newId = json?.pulse_id || json?.id || json?.submission?.id || "";
      if (!newId) {
        setSuccess(`Saved ✅ (but API returned no pulse id)\n\nResponse:\n${JSON.stringify(json, null, 2)}`);
        return;
      }

      setSuccess(`Saved ✅ Pulse ID: ${newId}`);
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Employee Pulse</h1>

      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 10 }}>
        Quick, anonymous pulse check across the five HRI pillars. Please answer each question from 1–5.
      </p>

      {/* ✅ Helpful debug line while stabilising — remove later */}
      {!loading && (
        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 14 }}>
          Org ID: <strong style={{ color: "#E5E7EB" }}>{org?.organisation_id || "—"}</strong>
        </p>
      )}

      {loading && <p style={{ color: "#9CA3AF" }}>Loading pulse questions…</p>}

      {!loading && error && <p style={{ color: "#F97316", marginBottom: 12, whiteSpace: "pre-wrap" }}>{error}</p>}
      {!loading && success && <p style={{ color: "#34D399", marginBottom: 12, whiteSpace: "pre-wrap" }}>{success}</p>}

      {!loading && questions.length === 0 && <p style={{ color: "#9CA3AF" }}>No pulse questions found.</p>}

      {!loading && questions.length > 0 && (
        <>
          <div style={{ marginBottom: 14, fontSize: 12, color: "#9CA3AF" }}>
            Answered: <strong style={{ color: "#E5E7EB" }}>{answeredCount}/{total}</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {questions.map((q) => (
              <div
                key={q.id}
                style={{
                  border: "1px solid #1F2937",
                  borderRadius: 12,
                  padding: 14,
                  background: "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
                }}
              >
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  {q.pillar}
                </div>

                <div style={{ fontSize: 14, color: "#F9FAFB", marginTop: 6, marginBottom: 10 }}>
                  {q.position}. {q.question_text}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const active = Number(answers[q.id]) === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: n }))}
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
