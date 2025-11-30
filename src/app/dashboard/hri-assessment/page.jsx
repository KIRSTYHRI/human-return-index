"use client";

import { useState } from "react";

const SCALE_OPTIONS = [
  { value: 1, label: "1 – Strongly disagree" },
  { value: 2, label: "2 – Disagree" },
  { value: 3, label: "3 – Neutral" },
  { value: 4, label: "4 – Agree" },
  { value: 5, label: "5 – Strongly agree" },
];

// Your five HRI pillars + questions (from what you pasted)
const PILLARS = [
  {
    name: "Leadership",
    code: "leadership",
    description:
      "Score each statement based on how true it feels today in your organisation.",
    questions: [
      "Leaders in our organisation clearly communicate vision and priorities.",
      "Leaders role model the behaviours we expect from everyone else.",
      "Leaders are approachable and open to feedback.",
      "I trust the decisions our leaders make.",
      "Leaders act quickly when issues affecting people are raised.",
    ],
  },
  {
    name: "Wellbeing & Mental Health",
    code: "wellbeing",
    description:
      "Score each statement based on how true it feels today in your organisation.",
    questions: [
      "Workload and expectations feel sustainable most of the time.",
      "People feel safe to speak about stress or mental health challenges.",
      "We have clear support routes (EAP, MHFA, line manager, etc.).",
      "Breaks, rest and time off are respected in practice.",
      "Wellbeing is treated as part of performance, not a ‘nice to have’.",
    ],
  },
  {
    name: "Inclusion & Belonging",
    code: "inclusion",
    description:
      "Score each statement based on how true it feels today in your organisation.",
    questions: [
      "People feel they can be themselves at work without judgment.",
      "Different views and backgrounds are genuinely welcomed.",
      "We call out poor behaviours that undermine inclusion.",
      "Managers understand how to support different needs (incl. neurodiversity).",
      "Our policies and practices feel fair and consistent.",
    ],
  },
  {
    name: "Growth & Development",
    code: "growth",
    description:
      "Score each statement based on how true it feels today in your organisation.",
    questions: [
      "People know what’s expected of them and how success is measured.",
      "Development conversations happen regularly, not just once a year.",
      "There are real opportunities to grow skills and progress.",
      "People receive useful feedback that helps them improve.",
      "Development decisions feel fair and transparent.",
    ],
  },
  {
    name: "Trust & Communication",
    code: "trust",
    description:
      "Score each statement based on how true it feels today in your organisation.",
    questions: [
      "Information is shared openly and in good time.",
      "People feel safe to raise concerns without fear of backlash.",
      "Teams collaborate well across departments.",
      "There is a strong sense of trust between managers and teams.",
      "Internal communication is clear, consistent and two-way.",
    ],
  },
];

export default function HriAssessmentPage() {
  // answers: { [questionKey]: 1–5 }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Build simple ID per question: `${pillarCode}_${index}`
  const allQuestionKeys = PILLARS.flatMap((pillar) =>
    pillar.questions.map((_, idx) => `${pillar.code}_${idx}`)
  );

  const totalQuestions = allQuestionKeys.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered =
    totalQuestions > 0 && answeredCount === totalQuestions;

  function handleAnswerChange(questionKey, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: Number(value),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setError("");
    setResult(null);

    try {
      // 1) Build enriched answers array for API + local scoring
      const enrichedAnswers = [];

      for (const pillar of PILLARS) {
        pillar.questions.forEach((qText, idx) => {
          const key = `${pillar.code}_${idx}`;
          const rawScore = answers[key];

          if (!rawScore) return;

          const score1to5 = Number(rawScore);
          const score100 = Math.round((score1to5 / 5) * 100);

          enrichedAnswers.push({
            question_id: key,
            pillar: pillar.name,
            score1to5,
            score100,
            question_text: qText,
          });
        });
      }

      // Local calculation in case API fails
      const byPillar = new Map();
      for (const a of enrichedAnswers) {
        if (!byPillar.has(a.pillar)) byPillar.set(a.pillar, []);
        byPillar.get(a.pillar).push(a.score100);
      }

      const localPillarScores = [];
      let sum = 0;
      let count = 0;

      for (const [pillarName, values] of byPillar.entries()) {
        if (!values.length) continue;
        const avg =
          values.reduce((s, v) => s + v, 0) / values.length;
        const rounded = Math.round(avg);
        localPillarScores.push({ pillar: pillarName, score: rounded });
        sum += rounded;
        count += 1;
      }

      const localOverall =
        count > 0 ? Math.round(sum / count) : null;

      // 2) Call API (best effort)
      let apiResult = null;
      try {
        const resp = await fetch("/api/assessment-scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessment_id: "internal-demo-2025-11", // satisfies "Missing assessment_id"
            answers: enrichedAnswers,
            meta: {
              source: "hri-dashboard-internal-assessment",
              created_at: new Date().toISOString(),
            },
          }),
        });

        const json = await resp.json().catch(() => null);
        if (resp.ok && json && json.ok) {
          apiResult = json;
        } else {
          console.warn("assessment-scores API error:", json);
        }
      } catch (err) {
        console.warn("assessment-scores API call failed:", err);
      }

      // 3) Decide what to show: API result if good, else local
      const finalOverall =
        apiResult?.overallScore ?? localOverall;
      const finalPillars =
        apiResult?.pillarScores ?? localPillarScores;

      setResult({
        overallScore: finalOverall,
        pillarScores: finalPillars,
        answeredCount,
        totalQuestions,
      });
    } catch (err) {
      console.error("Submit error:", err);
      setError(
        err?.message ||
          "Something went wrong saving your assessment."
      );
    } finally {
      setSubmitting(false);
    }
  }

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
      {/* Page intro */}
      <section style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Human Return Index™ – Internal Assessment
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#9CA3AF",
            marginBottom: 6,
          }}
        >
          This is your leadership view of how things are really working
          across the five HRI pillars. Rate each statement from 1 (strongly
          disagree) to 5 (strongly agree). We’ll convert your responses into
          0–100 scores per pillar and an overall internal HRI.
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

      {error && (
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
          {error}
        </div>
      )}

      {/* Assessment form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {PILLARS.map((pillar) => (
            <section
              key={pillar.code}
              style={{
                borderRadius: 16,
                border: "1px solid #1F2937",
                padding: 16,
                background:
                  "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: "#F9FAFB",
                  }}
                >
                  {pillar.name}
                </h2>
                <p
                  style={{
                    fontSize: 13,
                    color: "#9CA3AF",
                  }}
                >
                  {pillar.description}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {pillar.questions.map((qText, idx) => {
                  const key = `${pillar.code}_${idx}`;
                  const currentValue = answers[key] ?? "";

                  return (
                    <div
                      key={key}
                      style={{
                        borderRadius: 12,
                        border: "1px solid #111827",
                        padding: 10,
                        background:
                          "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          color: "#E5E7EB",
                          marginBottom: 8,
                        }}
                      >
                        {qText}
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
                              name={key}
                              value={opt.value}
                              checked={currentValue === opt.value}
                              onChange={(e) =>
                                handleAnswerChange(
                                  key,
                                  Number(e.target.value)
                                )
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
            </section>
          ))}
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
          {submitting
            ? "Calculating your internal HRI…"
            : "Save assessment scores"}
        </button>
      </form>

      {/* Result summary */}
      {result && (
        <section
          style={{
            marginTop: 28,
            borderRadius: 16,
            border: "1px solid #1F2937",
            padding: 18,
            background:
              "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 8,
              color: "#F9FAFB",
            }}
          >
            Internal HRI snapshot
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              marginBottom: 10,
            }}
          >
            This is your internal leadership view only. Later, your main
            dashboard will compare this against live employee pulse data.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#9CA3AF",
                  marginBottom: 4,
                }}
              >
                Overall internal score
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#F9FAFB",
                }}
              >
                {result.overallScore != null
                  ? result.overallScore
                  : "–"}
                <span
                  style={{
                    fontSize: 16,
                    opacity: 0.7,
                    marginLeft: 4,
                  }}
                >
                  / 100
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 4,
                }}
              >
                Based on {result.answeredCount} of{" "}
                {result.totalQuestions} responses.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(150px, 1fr))",
                gap: 10,
                flex: 1,
              }}
            >
              {result.pillarScores.map((p) => (
                <div
                  key={p.pillar}
                  style={{
                    borderRadius: 12,
                    border: "1px solid #111827",
                    padding: 10,
                    background:
                      "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      marginBottom: 4,
                    }}
                  >
                    {p.pillar}
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#F9FAFB",
                    }}
                  >
                    {p.score}
                    <span
                      style={{
                        fontSize: 13,
                        opacity: 0.7,
                        marginLeft: 2,
                      }}
                    >
                      / 100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
