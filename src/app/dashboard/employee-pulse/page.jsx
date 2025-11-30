"use client";

import { useEffect, useState } from "react";

const SCALE_OPTIONS = [
  { value: 1, label: "1 – Strongly disagree" },
  { value: 2, label: "2 – Disagree" },
  { value: 3, label: "3 – Neutral" },
  { value: 4, label: "4 – Agree" },
  { value: 5, label: "5 – Strongly agree" },
];

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load pulse questions
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadError("");
        setSubmitSuccess(false);

        const res = await fetch("/api/pulse-questions", {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Failed to load pulse questions");
        }

        const items = Array.isArray(json.questions)
          ? json.questions
          : Array.isArray(json)
          ? json
          : [];

        setQuestions(items);
      } catch (err) {
        console.error("Error loading pulse questions:", err);
        setLoadError(
          err.message || "Something went wrong loading pulse questions."
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
  const allAnswered =
    totalQuestions > 0 && answeredCount === totalQuestions;

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
        source: "employee-pulse-dashboard",
        responses,
      };

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.ok === false)) {
        throw new Error(
          (json && json.error) || "Failed to submit pulse response"
        );
      }

      setSubmitSuccess(true);
      setAnswers({});
    } catch (err) {
      console.error("Employee pulse submit error:", err);
      setSubmitError(
        err.message ||
          "Something went wrong submitting your pulse. Please try again."
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
          Employee Pulse
        </h1>
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>
          Loading your pulse questions…
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
          Employee Pulse
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#FCA5A5",
            marginBottom: 8,
          }}
        >
          {loadError}
        </p>
        <p style={{ fontSize: 13, color: "#9CA3AF" }}>
          If this keeps happening, check{" "}
          <code>/api/pulse-questions</code> is returning data.
        </p>
      </div>
    );
  }

  if (!questions.length) {
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
          Employee Pulse
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#9CA3AF",
          }}
        >
          No pulse questions are configured yet. Add rows into{" "}
          <code>hri_pulse_questions</code> and refresh this page.
        </p>
      </div>
    );
  }

  // ---------- MAIN FORM UI ----------

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
          Employee Pulse
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#9CA3AF",
            marginBottom: 6,
          }}
        >
          Quick, anonymous sentiment check across the five HRI pillars.
          Score each statement from 1 (strongly disagree) to 5 (strongly agree).
          Your responses feed into the live Human Return Index™ view.
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
          Thanks for sharing your pulse. Your responses are now feeding into the
          live HRI people view.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {questions.map((q) => {
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
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  {q.pillar}
                </div>
                <div
                  style={{
                    fontSize: 14,
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
          {submitting ? "Submitting your pulse…" : "Submit pulse response"}
        </button>
      </form>
    </div>
  );
}
