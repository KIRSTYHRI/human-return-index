"use client";

import { useEffect, useState } from "react";

// Same 5 pillars, 5 questions each – this is your
// leadership / internal HRI assessment for 0–100 pillar scores.
const PILLARS = [
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

// Turn a 1–5 answer into a 0–100 score
function toScore(value) {
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return num * 20; // 1 → 20 … 5 → 100
}

export default function HriAssessmentPage() {
  const [overview, setOverview] = useState(null);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 1) Fetch latest assessment meta so we know which assessment_id to attach scores to
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

    // Build per-pillar scores payload
    const scoresPayload = [];

    for (const pillar of PILLARS) {
      const qScores = pillar.questions
        .map((q) => toScore(answers[q.id]))
        .filter((s) => s != null);

      if (qScores.length === 0) continue;

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
        "Assessment saved. Your dashboard and ROI view now reflect these updated pillar scores."
      );
    } catch (err) {
      console.error("Error submitting HRI assessment:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Internal Assessment
        </h1>
        <p style={{ marginBottom: 6, opacity: 0.8 }}>
          This is your leadership view of how things are really working across the
          five HRI pillars. Rate each statement from 1 (strongly disagree) to 5
          (strongly agree).
        </p>
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          We’ll convert your responses into 0–100 scores per pillar and update
          your main dashboard. One clean view for you, your exec team and the
          board.
        </p>
      </header>

      {overview && (
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            marginBottom: 20,
            fontSize: 13,
            background: "#fafafa",
          }}
        >
          <div style={{ opacity: 0.7, marginBottom: 4 }}>Current assessment</div>
          <div style={{ fontWeight: 600 }}>{overview.title}</div>
          <div style={{ opacity: 0.7 }}>
            Period: {overview.period_start} → {overview.period_end} · Status:{" "}
            {overview.status}
          </div>
        </section>
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

      <form onSubmit={handleSubmit}>
        {PILLARS.map((pillar) => (
          <section
            key={pillar.id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              background: "#fff",
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {pillar.label}
            </h2>
            <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
              Score each statement based on how true it feels today in your
              organisation.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pillar.questions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    border: "1px solid #f4f4f4",
                    borderRadius: 8,
                    padding: 10,
                    background: "#fcfcfc",
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

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#000",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving…" : "Save assessment scores"}
          </button>
        </div>
      </form>
    </main>
  );
}
