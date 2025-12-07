// src/app/dashboard/hri-assessment/page.jsx
"use client";

import { useEffect, useState } from "react";

const SCALE_OPTIONS = [
  { value: 1, label: "1 – Strongly disagree" },
  { value: 2, label: "2 – Disagree" },
  { value: 3, label: "3 – Neutral" },
  { value: 4, label: "4 – Agree" },
  { value: 5, label: "5 – Strongly agree" },
];

// Must match pillar names in employer_questions
const PILLAR_ORDER = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

export default function HriAssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load all 25 employer questions
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch("/api/employer-questions", {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Failed to load assessment questions");
        }

        const items = Array.isArray(json.questions)
          ? json.questions
          : Array.isArray(json)
          ? json
          : [];

        setQuestions(items);
      } catch (err) {
        console.error("Error loading employer questions:", err);
        setLoadError(
          err.message || "Something went wrong loading questions."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(value),
    }));
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  async function handleSubmit(e) {
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

      const body = {
        title: "HRI Assessment – Internal",
        source: "hri-dashboard-internal-assessment",
        responses,
      };

      const res = await fetch("/api/assessments/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.ok === false)) {
        throw new Error(
          (json && json.error) || "Failed to save assessment"
        );
      }

      setSubmitSuccess(true);
    } catch (err) {
      console.error("Assessment submit error:", err);
      setSubmitError(
        err.message ||
          "Something went wrong saving your assessment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- UI STATES ----------

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "24px 24px 40px",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#E5E7EB",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Human Return Index™ – Internal Assessment
        </h1>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>
          Loading your HRI assessment questions…
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "24px 24px 40px",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#E5E7EB",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Human Return Index™ – Internal Assessment
        </h1>
        <p style={{ fontSize: 14, color: "#FCA5A5" }}>{loadError}</p>
      </div>
    );
  }

  const questionsByPillar = PILLAR_ORDER.map((pillarName) => ({
    pillar: pillarName,
    items: questions.filter((q) => q.pillar === pillarName),
  })).filter((group) => group.items.length > 0);

  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#E5E7EB",
      }}
    >
      {/* Intro */}
      <section style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Internal Assessment
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#9CA3AF",
            marginBottom: 6,
          }}
        >
          Capture how your organisation is really doing across the five HRI
          pillars. This is your leadership benchmark before you layer in live
          employee data.
        </p>
        <p
          style={{
            fontSize: 12,
            color: "#9CA3AF",
          }}
        >
          {answeredCount} of {totalQuestions} questions answered.
        </p>
      </section>

      {submitError && (
        <div
          style={{
            marginBottom: 16,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #F97316",
            background: "#451a03",
            color: "#FED7AA",
            fontSize: 13,
          }}
        >
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div
          style={{
            marginBottom: 16,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #22C55E",
            background: "#052e16",
            color: "#BBF7D0",
            fontSize: 13,
          }}
        >
          Assessment saved. Your dashboard and ROI view now reflect these
          updated pillar scores.
        </div>
      )}

      {/* 25-question form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {questionsByPillar.map((group) => (
            <section
              key={group.pillar}
              style={{
                borderRadius: 16,
                border: "1px solid #1F2937",
                padding: 16,
                background:
                  "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
              }}
            >
              <div
                style={{
                  marginBottom: 10,
                }}
              >
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#F9FAFB",
                    marginBottom: 2,
                  }}
                >
                  {group.pillar}
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    maxWidth: 520,
                  }}
                >
                  Score each statement based on how true it feels today in
                  your organisation.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {group.items.map((q) => {
                  const currentValue = answers[q.id] ?? "";

                  return (
                    <div
                      key={q.id}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #111827",
                        padding: 12,
                        background:
                          "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: "#E5E7EB",
                          marginBottom: 8,
                        }}
                      >
                        {q.question_text}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 8,
                          fontSize: 12,
                        }}
                      >
                        {SCALE_OPTIONS.map((opt) => (
                          <label
                            key={opt.value}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "6px 10px",
                              borderRadius: 999,
                              border:
                                currentValue === opt.value
                                  ? "1px solid #FACC15"
                                  : "1px solid #1F2937",
                              background:
                                currentValue === opt.value
                                  ? "rgba(250, 204, 21, 0.1)"
                                  : "rgba(15,23,42,0.9)",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="radio"
                              name={`q_${q.id}`}
                              value={opt.value}
                              checked={currentValue === opt.value}
                              onChange={(e) =>
                                handleChange(q.id, Number(e.target.value))
                              }
                              style={{ cursor: "pointer" }}
                            />
                            <span>{opt.label}</span>
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
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor:
              allAnswered && !submitting ? "pointer" : "not-allowed",
            background:
              allAnswered && !submitting ? "#FACC15" : "#4B5563",
            color: "#111827",
            opacity: allAnswered && !submitting ? 1 : 0.7,
          }}
        >
          {submitting ? "Saving your assessment…" : "Save assessment scores"}
        </button>
      </form>
    </div>
  );
}
