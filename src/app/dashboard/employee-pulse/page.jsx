"use client";

import { useEffect, useState } from "react";

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Fetch pulse questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/api/pulse-questions", { cache: "no-store" });
        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.error || "Failed to load questions");
        }

        setQuestions(json.questions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  async function submitPulse() {
    setError("");
    try {
      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        body: JSON.stringify({
          answers
        })
      });

      const json = await res.json();

      if (!json.ok) throw new Error(json.error || "Submission failed");

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Employee Pulse</h1>
        <p>Loading questions…</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Employee Pulse</h1>
        <p
          style={{
            marginTop: 12,
            padding: 12,
            background: "#D1FAE5",
            color: "#065F46",
            borderRadius: 8,
            maxWidth: 420
          }}
        >
          Thank you — your response has been submitted anonymously.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "24px 16px"
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 8
        }}
      >
        Employee Pulse
      </h1>

      <p style={{ fontSize: 14, marginBottom: 20, opacity: 0.85 }}>
        Quick, anonymous pulse check across the five HRI pillars.  
        Please answer each question from 1–5.
      </p>

      {error && (
        <p
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            padding: 12,
            borderRadius: 8,
            marginBottom: 12
          }}
        >
          {error}
        </p>
      )}

      {/* Render questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              padding: 16,
              borderRadius: 12,
              border: "1px solid #E5E7EB",
              background: "#FFF"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {q.pillar} — <span style={{ opacity: 0.7 }}>{q.question_text}</span>
            </div>

            {/* Radio buttons 1–5 */}
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 8
              }}
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <label
                  key={num}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={num}
                    checked={answers[q.id] === num}
                    onChange={() =>
                      setAnswers({
                        ...answers,
                        [q.id]: num
                      })
                    }
                  />
                  <span style={{ fontSize: 12 }}>{num}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit button */}
      <button
        onClick={submitPulse}
        style={{
          marginTop: 24,
          padding: "10px 20px",
          background: "#111827",
          color: "#FFF",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 600
        }}
      >
        Submit pulse response
      </button>
    </div>
  );
}
