"use client";

import { useEffect, useState } from "react";

const SCALE_OPTIONS = [
  { value: 1, label: "1 – Strongly disagree" },
  { value: 2, label: "2 – Disagree" },
  { value: 3, label: "3 – Neutral" },
  { value: 4, label: "4 – Agree" },
  { value: 5, label: "5 – Strongly agree" },
];

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setLoadingError("");
        const res = await fetch("/api/pulse-questions", {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(
            json.error || "Failed to load pulse questions"
          );
        }

        const items = Array.isArray(json.questions)
          ? json.questions
          : Array.isArray(json)
          ? json
          : [];

        setQuestions(items);
      } catch (err) {
        console.error("pulse questions load error", err);
        setLoadingError(
          err?.message || "Something went wrong loading questions."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleAnswerChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(value),
    }));
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered =
    totalQuestions > 0 && answeredCount === totalQuestions;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setSubmitError("");
    setResult(null);

    try {
      // Build responses payload + local scoring
      const responses = [];
      const byPillar = new Map();

      for (const q of questions) {
        const score1to5 = answers[q.id];
        if (!score1to5) continue;

        const score100 = Math.round((score1to5 / 5) * 100);
        const pillarName =
          q.pillar || q.pillar_name || "Unknown pillar";

        responses.push({
          question_id: q.id,
          pillar: pillarName,
          score1to5,
          score100,
        });

        if (!byPillar.has(pillarName)) {
          byPillar.set(pillarName, []);
        }
        byPillar.get(pillarName).push(score100);
      }

      // Local pillar + overall scores (in case API fails)
      const pillarScores = [];
      let sum = 0;
      let count = 0;

      for (const [pillarName, values] of byPillar.entries()) {
        if (!values.length) continue;
        const avg =
          values.reduce((s, v) => s + v, 0) / values.length;
        const rounded = Math.round(avg);
        pillarScores.push({ pillar: pillarName, score: rounded });
        sum += rounded;
        count += 1;
      }

      const overallScore =
        count > 0 ? Math.round(sum / count) : null;

      // Call backend – best effort
      let apiResult = null;
      try {
        const resp = await fetch("/api/employee-pulse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responses,
            meta: {
              source: "hri-dashboard-employee-pulse",
              submitted_at: new Date().toISOString(),
            },
          }),
        });

        const json = await resp.json().catch(() => null);
        if (resp.ok && json && json.ok) {
          apiResult = json;
        } else {
          console.warn("employee-pulse API error:", json);
        }
      } catch (err) {
        console.warn("employee-pulse API call failed:", err);
      }

      setResult({
        overallScore:
          apiResult?.overallScore ?? overallScore,
        pillarScores:
          apiResult?.pillarScores ?? pillarScores,
        answeredCount,
        totalQuestions,
      });
    } catch (err) {
      console.error("pulse submit error", err);
      setSubmitError(
        err?.message ||
          "Something went wrong submitting your pulse."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ---------- UI ----------

  if (loading) {
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
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Employee Pulse
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#9CA3AF",
          }}
        >
          Loading your pulse questions…
        </p>
      </div>
    );
  }

  if (loadingError) {
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
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Employee Pulse
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#FCA5A5",
          }}
        >
          {loadingError}
        </p>
      </div>
    );
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
      {/* Intro */}
      <section style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 6,
          }}
        >
          Employee Pulse
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#9CA3AF",
            marginBottom: 6,
          }}
        >
          Quick, anonymous sentiment check across the five HRI pillars –
          this demo focuses on the scoring and experience your employees
          will go through.
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

      {submitError && (
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
          {submitError}
        </div>
      )}

      {/* Questions form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {questions.map((q) => {
            const currentValue = answers[q.id] ?? "";

            return (
              <div
                key={q.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid #111827",
                  padding: 12,
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
                  {q.pillar || q.pillar_name || "Pillar"}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#E5E7EB",
                    marginBottom: 8,
                  }}
                >
                  {q.question_text || q.text}
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
                        name={`q_${q.id}`}
                        value={opt.value}
                        checked={currentValue === opt.value}
                        onChange={(e) =>
                          handleAnswerChange(
                            q.id,
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
            ? "Submitting your pulse…"
            : "Submit pulse response"}
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
            Pulse snapshot
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              marginBottom: 10,
            }}
          >
            This is how this single pulse response scores across the HRI
            pillars. On your main dashboard you’ll see this aggregated
            across all employees.
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
                Overall pulse score
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
                {result.totalQuestions} questions.
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
