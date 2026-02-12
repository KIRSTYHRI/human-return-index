"use client";

import { useEffect, useMemo, useState } from "react";

const SCALE = [
  { value: 1, label: "Never (1)" },
  { value: 2, label: "Rarely (2)" },
  { value: 3, label: "Sometimes (3)" },
  { value: 4, label: "Often (4)" },
  { value: 5, label: "Always (5)" },
];

const PILLAR_ORDER = [
  "WELLBEING & MENTAL HEALTH",
  "LEADERSHIP",
  "TRUST & COMMUNICATION",
  "GROWTH & DEVELOPMENT",
  "INCLUSION & BELONGING",
];

export default function AssessmentClient() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch("/api/employer-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Failed to load employer questions");
        }

        const items = Array.isArray(json.questions) ? json.questions : [];
        setQuestions(items);
      } catch (err) {
        console.error("assessment load error", err);
        setLoadError(err?.message || "Failed to load questions.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  const grouped = useMemo(() => {
    const uniquePillars = Array.from(new Set(questions.map((q) => q.pillar))).filter(Boolean);
    const order = PILLAR_ORDER.filter((p) => uniquePillars.includes(p));
    const finalOrder = order.length ? order : uniquePillars;

    return finalOrder.map((pillar) => ({
      pillar,
      items: questions
        .filter((q) => q.pillar === pillar)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }));
  }, [questions]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const responses = questions.map((q) => ({
        question_id: q.id,
        pillar: q.pillar,
        score_1to5: answers[q.id],
      }));

      const res = await fetch("/api/assessments/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "HRI Assessment – Internal",
          source: "hri-dashboard-internal-assessment",
          responses,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || (json && json.ok === false)) {
        throw new Error((json && json.error) || "Failed to save assessment");
      }

      setSubmitSuccess(true);
    } catch (err) {
      console.error("assessment submit error", err);
      setSubmitError(err?.message || "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 24px 40px", color: "#E5E7EB" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Internal Assessment</h1>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>Loading…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 24px 40px", color: "#E5E7EB" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Internal Assessment</h1>
        <p style={{ fontSize: 14, color: "#FCA5A5" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 24px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Internal Assessment</h1>

      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 10 }}>
        Capture how your organisation sees itself across the five HRI pillars.
      </p>

      <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>
        {answeredCount} of {totalQuestions} questions answered.
      </p>

      {submitError && (
        <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, border: "1px solid #F97316", background: "#451a03", color: "#FED7AA", fontSize: 13 }}>
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, border: "1px solid #22C55E", background: "#052e16", color: "#BBF7D0", fontSize: 13 }}>
          Assessment saved ✅
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {grouped.map((group) => (
            <section
              key={group.pillar}
              style={{
                borderRadius: 16,
                border: "1px solid #1F2937",
                padding: 16,
                background: "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
              }}
            >
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {group.pillar}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {group.items.map((q) => {
                  const current = answers[q.id] ?? null;
                  const qText = q.question_text ?? q.text ?? q.question ?? "—";

                  return (
                    <div key={q.id} style={{ borderRadius: 12, border: "1px solid #111827", padding: 12 }}>
                      <div style={{ fontSize: 13, color: "#E5E7EB", marginBottom: 10 }}>
                        {qText}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {SCALE.map((opt) => (
                          <label
                            key={opt.value}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 10px",
                              borderRadius: 999,
                              border: current === opt.value ? "1px solid #FACC15" : "1px solid #1F2937",
                              background: current === opt.value ? "rgba(250, 204, 21, 0.10)" : "rgba(15,23,42,0.9)",
                              cursor: "pointer",
                              fontSize: 12,
                            }}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={opt.value}
                              checked={current === opt.value}
                              onChange={() => setAnswer(q.id, opt.value)}
                              style={{ cursor: "pointer" }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <button
          type="submit"
          disabled={!allAnswered || submitting}
          style={{
            marginTop: 18,
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            fontSize: 14,
            fontWeight: 700,
            cursor: allAnswered && !submitting ? "pointer" : "not-allowed",
            background: allAnswered && !submitting ? "#FACC15" : "#4B5563",
            color: "#111827",
            opacity: allAnswered && !submitting ? 1 : 0.7,
          }}
        >
          {submitting ? "Saving…" : "Save assessment scores"}
        </button>
      </form>
    </div>
  );
}
