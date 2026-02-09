"use client";

import { useEffect, useState } from "react";

const SCALE_OPTIONS = [
  { value: 1, label: "Strongly disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly agree" },
];

export default function AssessmentPage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // 1. Load questions from your API
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/internal-assessment-questions", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load assessment questions");
        }

        const json = await res.json();
        if (!json.ok) {
          throw new Error(json.error || "Failed to load assessment questions");
        }

        setQuestions(Array.isArray(json.questions) ? json.questions : []);
      } catch (err) {
        console.error("Assessment load error:", err);
        setError(err.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 2. Handle selecting an answer
  function handleAnswerChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  // 3. On submit – calculate internal scores (0–100) per pillar + overall
  async function handleSubmit(e) {
    e.preventDefault();
    if (!allAnswered || submitting) return;

    try {
      setSubmitting(true);
      setError("");

      // Build array of { question, pillar, score }
      const enriched = questions
        .map((q) => {
          const id = q.id || q.code;
          const rawValue = answers[id];
          if (!rawValue) return null;

          const score1to5 = Number(rawValue);
          const score100 = Math.round((score1to5 / 5) * 100);

          return {
            id,
            pillar: q.pillar || "HRI Pillar",
            score1to5,
            score100,
            question_text: q.question_text || q.text,
          };
        })
        .filter(Boolean);

      // Group by pillar
      const byPillar = new Map();
      for (const item of enriched) {
        if (!byPillar.has(item.pillar)) {
          byPillar.set(item.pillar, []);
        }
        byPillar.get(item.pillar).push(item.score100);
      }

      const pillarScores = [];
      let sumAll = 0;
      let countAll = 0;

      for (const [pillar, values] of byPillar.entries()) {
        if (!values.length) continue;
        const avg =
          values.reduce((sum, v) => sum + v, 0) / values.length;
        const rounded = Math.round(avg);
        pillarScores.push({ pillar, score: rounded });
        sumAll += rounded;
        countAll += 1;
      }

      const overallScore =
        countAll > 0 ? Math.round(sumAll / countAll) : null;

      const payload = {
        overallScore,
        pillarScores,
        totalQuestions,
        answeredCount,
      };

      // For now we just keep it client-side.
      // Later we can POST this to an API that writes to Supabase.
      console.log("Internal assessment result (local):", payload);

      // Save in state so we can show a summary card
      setResult(payload);

      // Optional: persist locally so it survives refresh (demo only)
      try {
        localStorage.setItem(
          "hri-internal-assessment-latest",
          JSON.stringify(payload)
        );
      } catch {
        // ignore storage errors in demo
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Unexpected error submitting assessment");
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
      {/* Intro */}
      <section style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Internal Assessment
        </h1>
        <p
          style={{
            fontSize: 14,
            maxWidth: 720,
            color: "#9CA3AF",
          }}
        >
          Capture how your organisation sees itself across the five HRI
          pillars. This is your internal benchmark before you layer in
          live employee data.
        </p>
        {totalQuestions > 0 && (
          <p
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "#9CA3AF",
            }}
          >
            {answeredCount} of {totalQuestions} questions answered.
          </p>
        )}
      </section>

      {/* Loading / error states */}
      {loading && (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>
          Loading assessment questions…
        </p>
      )}

      {!loading && error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
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

      {!loading && !error && questions.length === 0 && (
        <p style={{ fontSize: 14, color: "#9CA3AF" }}>
          No questions found yet. Once your API returns data, they’ll appear
          here automatically.
        </p>
      )}

      {/* Questions form */}
      {!loading && !error && questions.length > 0 && (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {questions.map((q, index) => {
              const id = q.id || q.code;
              const pillar = q.pillar || "HRI Pillar";
              const value = answers[id] || "";

              return (
                <div
                  key={id || index}
                  style={{
                    borderRadius: 16,
                    border: "1px solid #1F2937",
                    padding: 16,
                    background:
                      "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    {pillar}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#F9FAFB",
                      marginBottom: 10,
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
                            String(value) === String(opt.value)
                              ? "1px solid #FACC15"
                              : "1px solid #1F2937",
                          background:
                            String(value) === String(opt.value)
                              ? "rgba(250, 204, 21, 0.1)"
                              : "rgba(15,23,42,0.9)",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="radio"
                          name={id}
                          value={opt.value}
                          checked={String(value) === String(opt.value)}
                          onChange={(e) =>
                            handleAnswerChange(id, e.target.value)
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={!allAnswered || submitting}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: allAnswered && !submitting ? "pointer" : "not-allowed",
              background: allAnswered && !submitting ? "#FACC15" : "#4B5563",
              color: "#111827",
              opacity: allAnswered && !submitting ? 1 : 0.7,
            }}
          >
            {submitting
              ? "Calculating your internal HRI…"
              : "Save internal assessment"}
          </button>
        </form>
      )}

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
            This is your internal view only. When employee pulse data comes
            in, your main dashboard will compare both.
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
