"use client";

import { useEffect, useState } from "react";

export default function HRIAssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/employer-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) throw new Error(json.error || "Failed to load questions");

        setQuestions(json.questions || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  if (loading) return <div>Loading Internal Assessment…</div>;
  if (error) return <div style={{ color: "red" }}>Error loading assessment: {error}</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Internal Assessment</h1>
      <p>Employer Assessment – {questions.length} questions</p>

      {questions.map((q, index) => (
        <div
          key={q.id}
          style={{
            padding: "16px",
            marginBottom: "12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
          }}
        >
          <strong>
            {index + 1}. {q.pillar}
          </strong>
          <p>{q.question_text}</p>
        </div>
      ))}
    </div>
  );
}
