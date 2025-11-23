"use client";

import { useEffect, useState } from "react";

// 🔹 Fallback questions (used only if API fails)
const DEFAULT_PILLARS = [
  {
    id: "Leadership",
    label: "Leadership",
    questions: [
      {
        id: "leadership_q1",
        text: "Leaders in our organisation clearly communicate vision and priorities.",
      },
      {
        id: "leadership_q2",
        text: "Leaders role model the behaviours we expect from everyone else.",
      },
      {
        id: "leadership_q3",
        text: "Leaders are approachable and open to feedback.",
      },
      {
        id: "leadership_q4",
        text: "I trust the decisions our leaders make.",
      },
      {
        id: "leadership_q5",
        text: "Leaders act quickly when issues affecting people are raised.",
      },
    ],
  },
  {
    id: "Wellbeing & Mental Health",
    label: "Wellbeing & Mental Health",
    questions: [
      {
        id: "wellbeing_q1",
        text: "Workload and expectations feel sustainable most of the time.",
      },
      {
        id: "wellbeing_q2",
        text: "People feel safe to speak about stress or mental health challenges.",
      },
      {
        id: "wellbeing_q3",
        text: "We have clear support routes (EAP, MHFA, line manager, etc.).",
      },
      {
        id: "wellbeing_q4",
        text: "Breaks, rest and time off are respected in practice.",
      },
      {
        id: "wellbeing_q5",
        text: "Wellbeing is treated as part of performance, not a ‘nice to have’.",
      },
    ],
  },
  {
    id: "Inclusion & Belonging",
    label: "Inclusion & Belonging",
    questions: [
      {
        id: "inclusion_q1",
        text: "People feel they can be themselves at work without judgment.",
      },
      {
        id: "inclusion_q2",
        text: "Different views and backgrounds are genuinely welcomed.",
      },
      {
        id: "inclusion_q3",
        text: "We call out poor behaviours that undermine inclusion.",
      },
      {
        id: "inclusion_q4",
        text: "Managers understand how to support different needs (incl. neurodiversity).",
      },
      {
        id: "inclusion_q5",
        text: "Our policies and practices feel fair and consistent.",
      },
    ],
  },
  {
    id: "Growth & Development",
    label: "Growth & Development",
    questions: [
      {
        id: "growth_q1",
        text: "People know what’s expected of them and how success is measured.",
      },
      {
        id: "growth_q2",
        text: "Development conversations happen regularly, not just once a year.",
      },
      {
        id: "growth_q3",
        text: "There are real opportunities to grow skills and progress.",
      },
      {
        id: "growth_q4",
        text: "People receive useful feedback that helps them improve.",
      },
      {
        id: "growth_q5",
        text: "Development decisions feel fair and transparent.",
      },
    ],
  },
  {
    id: "Trust & Communication",
    label: "Trust & Communication",
    questions: [
      {
        id: "trust_q1",
        text: "Information is shared openly and in good time.",
      },
      {
        id: "trust_q2",
        text: "People feel safe to raise concerns without fear of backlash.",
      },
      {
        id: "trust_q3",
        text: "Teams collaborate well across departments.",
      },
      {
        id: "trust_q4",
        text: "There is a strong sense of trust between managers and teams.",
      },
      {
        id: "trust_q5",
        text: "Internal communication is clear, consistent and two-way.",
      },
    ],
  },
];

// Helper to turn a 1–5 response into 0–100
function toScore(value) {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num * 20; // 1 → 20, 5 → 100
}

export default function HriAssessmentPage() {
  const [overview, setOverview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 🔹 New: live pillars from API (or fallback)
  const [pillars, setPillars] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");

  // 1) Fetch the current assessment via /api/overview
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/overview", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load current assessment");
        }
        setOverview(json.overview);
      } catch (err) {
        console.error("Error loading overview for assessment form:", err);
        setError(err.message);
      }
    })();
  }, []);

  // 2) Fetch employer questions from /api/employer-questions
  useEffect(() => {
    (async () => {
      try {
        setQuestionsLoading(true);
        const res = await fetch("/api/employer-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok || !Array.isArray(json.questions)) {
          throw new Error(json.error || "Failed to load questions");
        }

        // Group questions by pillar into the same shape as DEFAULT_PILLARS
        const grouped = json.questions.reduce((acc, q) => {
          const label = q.pillar || "Other";
          let section = acc.find((s) => s.label === label);
          if (!section) {
            section = { id: label, label, questions: [] };
            acc.push(section);
          }

          section.questions.push({
            id: q.code || q.id, // use code as the question id where possible
            text: q.question_text,
          });

          return acc;
        }, []);

        setPillars(grouped);
      } catch (err) {
        console.error("Error loading employer questions:", err);
        setQuestionsError(err.message || "Could not load questions. Using defaults.");
        // Fallback to the hard-coded questions
        setPillars(DEFAULT_PILLARS);
      } finally {
        setQuestionsLoading(false);
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

    if (!overview?.assessment_id) {
      setError("No current assessment found. Please check your dashboard setup.");
      return;
    }

    if (!pillars || pillars.length === 0) {
      setError("No questions loaded. Please try again or contact support.");
      return;
    }

    // 3) Build per-pillar scores based on answers
    const scoresPayload = [];

    for (const pillar of pillars) {
      const qScores = pillar.questions
        .map((q) => toScore(answers[q.id]))
        .filter((s) => s != null);

      if (qScores.length === 0) {
        continue;
      }

      const avg =
        qScores.reduce((sum, s) => sum + s, 0) / qScores.length;

      scoresPayload.push({
        pillar: pillar.id,
        score: avg,
      });
    }

    if (scoresPayload.length === 0) {
      setError("Please answer at least one question before submitting.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment_id: overview.assessment_id,
          scores: scoresPayload,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save scores");
      }

      setMessage(
        "Assessment saved. Your dashboard and assessments list will now reflect these pillar scores."
      );
    } catch (err) {
      console.error("Error submitting HRI assessment:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const pillarsToUse = pillars || DEFAULT_PILLARS;

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
        Human Return Index™ – Internal Assessment
      </h1>

      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Use this form to score your organisation across the 5 HRI pillars. Each
        question is rated from 1 (strongly disagree) to 5 (strongly agree).
        We’ll convert your responses into 0–100 pillar scores and push them
        straight into your current assessment.
      </p>

      {overview && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <div style={{ opacity: 0.7, marginBottom: 4 }}>Current assessment</div>
          <div style={{ fontWeight: 600 }}>{overview.title}</div>
          <div style={{ opacity: 0.7 }}>
            Period: {overview.period_start} → {overview.period_end} • Status:{" "}
            {overview.status}
          </div>
        </div>
      )}

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

      {questionsError && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#fff8e6",
            color: "#7a4b00",
            fontSize: 13,
          }}
        >
          {questionsError}
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

      {questionsLoading && !pillars && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#f4f4f4",
            color: "#444",
            fontSize: 13,
          }}
        >
          Loading questions…
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {pillarsToUse.map((pillar) => (
          <section
            key={pillar.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {pillar.label}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
              Rate each statement from 1 (strongly disagree) to 5 (strongly
              agree).
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pillar.questions.map((q) => (
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
                    {q.text}
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
          {saving ? "Saving…" : "Save assessment scores"}
        </button>
      </form>
    </main>
  );
}
