"use client";

import { useEffect, useState } from "react";

export default function AssessmentPage() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/internal-assessment-questions", {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to load assessment questions");

        const json = await res.json();
        setQuestions(Array.isArray(json.questions) ? json.questions : []);
      } catch (err) {
        console.error("Assessment load error:", err);
        setError(err?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#E5E7EB",
      }}
    >
      <section style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Internal Assessment
        </h1>
        <p style={{ fontSize: 14, maxWidth: 720, color: "#9CA3AF" }}>
          Capture how your organisation is really doing across the five HRI
          pillars. This is your internal view – the baseline you’ll compare
          against live employee data.
        </p>
      </section>

      {loading && (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>
          Loading assessment questions…
        </p>
      )}

      {error && !loading && (
        <p style={{ fontSize: 14, color: "#F97316" }}>{error}</p>
      )}

      {!loading && !error && questions.length === 0 && (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>
          No questions found yet. Once your API returns data, they’ll appear
          here automatically.
        </p>
      )}

      {!loading && questions.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {questions.map((q) => (
            <div
              key={q.id || q.code}
              style={{
                padding: 12,
                borderRadius: 12,
                border: "1px solid #1F2937",
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
                  letterSpacing: "0.08em",
                }}
              >
                {q.pillar || "HRI Pillar"}
              </div>

              <div style={{ fontSize: 14, color: "#F9FAFB" }}>
                {q.question_text || q.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
