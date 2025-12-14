"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function HRIAssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );

        const { data, error } = await supabase
          .from("employer_questions")
          .select("id, pillar, question_text, position")
          .order("position", { ascending: true });

        if (error) throw error;

        setQuestions(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  if (loading) {
    return <div>Loading Internal Assessment…</div>;
  }

  if (error) {
    return <div>Error loading assessment: {error}</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h1>Internal Assessment</h1>
      <p>Employer Assessment – 25 questions</p>

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
