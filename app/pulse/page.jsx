"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function PublicPulsePage() {
  const searchParams = useSearchParams();
  const organisationId = searchParams.get("org");

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("/api/pulse-questions");
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load");

        setQuestions(data?.questions || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  function setAnswer(id, value) {
    setAnswers((prev) => ({
      ...prev,
      [id]: Number(value),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!organisationId) {
      setError("Missing organisation link");
      return;
    }

    try {
      setSaving(true);

      const res = await fetch("/api/employee-pulse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          organisation_id: organisationId,
          answers,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data?.error || "Failed to submit");

      setDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <main style={{ padding: 40 }}>
        <h1>Thank you</h1>
        <p>Your feedback has been submitted.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, maxWidth: 700, margin: "0 auto" }}>
      <h1>Employee Pulse</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <form onSubmit={handleSubmit}>
          {questions.map((q, i) => (
            <div key={q.id} style={{ marginBottom: 20 }}>
              <div>{i + 1}. {q.question_text}</div>

              {[1, 2, 3, 4, 5].map((v) => (
                <label key={v} style={{ marginRight: 10 }}>
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={v}
                    onChange={() => setAnswer(q.id, v)}
                  />
                  {v}
                </label>
              ))}
            </div>
          ))}

          <button type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit"}
          </button>
        </form>
      )}
    </main>
  );
}
