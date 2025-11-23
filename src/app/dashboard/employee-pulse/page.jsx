"use client";

import { useEffect, useState } from "react";

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load the 10 pulse questions from /api/employee-questions
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/employee-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load employee pulse questions");
        }

        setQuestions(json.questions || []);
      } catch (err) {
        console.error("Error loading employee questions:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const entries = Object.entries(answers).filter(
      ([, value]) => value != null && value !== ""
    );

    if (entries.length === 0) {
      setError("Please answer at least one question before submitting.");
      return;
    }

    // Build a simple payload for now
    const payload = entries.map(([question_id, value]) => ({
      question_id,
      response_value: Number(value),
    }));

    try {
      setSaving(true);
      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to submit pulse responses");
      }

      setMessage("Thank you. Your responses have been recorded for this pulse check.");
    } catch (err) {
      console.error("Error submitting employee pulse:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Group questions by pillar for nicer layout
  const groupedByPillar = questions.reduce((acc, q) => {
    const key = q.pillar || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(q);
    return acc;
  }, {});

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Employee Pulse – 2-Minute Check-In
      </h1>

      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        This short pulse survey gives you a live view of how people are feeling across
        the 5 Human Return Index™ pillars. Each statement is rated from 1 (strongly
        disagree) to 5 (strongly agree).
      </p>

      {loading && <p>Loading pulse questions…</p>}

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#ffe6e6",
            color: "#7a0000",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#e6ffef",
            color: "#005c2e",
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}

      {!loading && !error && questions.length > 0 && (
        <form onSubmit={handleSubmit}>
          {Object.entries(groupedByPillar).map(([pillar, qs]) => (
            <section
              key={pillar}
              style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {pillar}
              </h2>
              <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
                Rate each statement from 1 (strongly disagree) to 5 (strongly agree).
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {qs.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      border: "1px solid #f4f4f4",
                      borderRadius: 8,
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        marginBottom: 8,
                      }}
                    >
                      {q.question_text}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        fontSize: 13,
                      }}
                    >
                      <select
                        value={answers[q.id] || ""}
                        onChange={(e) => handleChange(q.id, e.target.value)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px solid #ddd",
                        }}
                      >
                        <option value="">Select…</option>
                        <option value="1">1 – Strongly disagree</option>
                        <option value="2">2 – Disagree</option>
                        <option value="3">3 – Neutral</option>
                        <option value="4">4 – Agree</option>
                        <option value="5">5 – Strongly agree</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 8,
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saving ? "Submitting pulse…" : "Submit pulse responses"}
          </button>
        </form>
      )}

      {!loading && !error && questions.length === 0 && (
        <p>No pulse questions found. Please check your Supabase employee_questions table.</p>
      )}
    </main>
  );
}
