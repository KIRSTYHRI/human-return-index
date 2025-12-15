"use client";

import { useEffect, useState } from "react";

export default function HRIAssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/employer-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Failed to load employer questions");
        }

        setQuestions(json.questions || []);
      } catch (e) {
        setError(e.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div>Loading Internal Assessment…</div>;
  if (error) return <div style={{ color: "#FEE000" }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Internal Assessment</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>Employer Assessment – 25 questions</p>

      <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
        {questions.map((q, idx) => (
          <div
            key={q.id}
            style={{
              padding: 16,
              border: "1px solid rgba(148,163,184,0.25)",
              borderRadius: 10,
              background: "rgba(2,6,23,0.35)",
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {idx + 1} · {q.pillar}
            </div>
            <div style={{ marginTop: 6, fontSize: 15, lineHeight: 1.35 }}>
              {q.question_text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, opacity: 0.7, fontSize: 12 }}>
        Loaded: {questions.length} questions
      </div>
    </div>
  );
}
