// src/app/dashboard/assessment/page.jsx
"use client";

import { useState } from "react";

const SCALE_OPTIONS = [
  { value: 1, label: "Never (1)" },
  { value: 2, label: "Rarely (2)" },
  { value: 3, label: "Sometimes (3)" },
  { value: 4, label: "Often (4)" },
  { value: 5, label: "Always (5)" },
];

const PILLAR_ORDER = [
  "Human-Centred Leadership",
  "Wellbeing & Mental Health",
  "Inclusion, Safety & Belonging",
  "Growth, Learning & Performance",
  "Trust, Communication & Clarity",
];

// Your 25 employer questions – hard-coded, no Supabase needed
const QUESTIONS = [
  // Pillar 1 – Human-Centred Leadership
  {
    id: "q1",
    pillar: "Human-Centred Leadership",
    text: "Leaders in our organization actively listen to employee concerns and feedback",
  },
  {
    id: "q2",
    pillar: "Human-Centred Leadership",
    text: "Our leadership team demonstrates empathy and understanding in their interactions",
  },
  {
    id: "q3",
    pillar: "Human-Centred Leadership",
    text: "Leaders make decisions with employee wellbeing as a key consideration",
  },
  {
    id: "q4",
    pillar: "Human-Centred Leadership",
    text: "Our managers provide regular, constructive feedback and support",
  },
  {
    id: "q5",
    pillar: "Human-Centred Leadership",
    text: "Leadership is transparent about company decisions and their reasoning",
  },

  // Pillar 2 – Wellbeing & Mental Health
  {
    id: "q6",
    pillar: "Wellbeing & Mental Health",
    text: "Our organization provides adequate mental health support and resources",
  },
  {
    id: "q7",
    pillar: "Wellbeing & Mental Health",
    text: "Employees feel comfortable discussing mental health concerns at work",
  },
  {
    id: "q8",
    pillar: "Wellbeing & Mental Health",
    text: "Work-life balance is actively promoted and protected by management",
  },
  {
    id: "q9",
    pillar: "Wellbeing & Mental Health",
    text: "Stress levels in our workplace are manageable and well-supported",
  },
  {
    id: "q10",
    pillar: "Wellbeing & Mental Health",
    text: "Our organization has effective programs to prevent burnout",
  },

  // Pillar 3 – Inclusion, Safety & Belonging
  {
    id: "q11",
    pillar: "Inclusion, Safety & Belonging",
    text: "All employees feel safe to express their opinions and ideas without fear",
  },
  {
    id: "q12",
    pillar: "Inclusion, Safety & Belonging",
    text: "Our workplace celebrates diversity and different perspectives",
  },
  {
    id: "q13",
    pillar: "Inclusion, Safety & Belonging",
    text: "Everyone has equal opportunities for advancement regardless of background",
  },
  {
    id: "q14",
    pillar: "Inclusion, Safety & Belonging",
    text: "Discrimination and bias are actively addressed when they occur",
  },
  {
    id: "q15",
    pillar: "Inclusion, Safety & Belonging",
    text: "All team members feel they truly belong and are valued for who they are",
  },

  // Pillar 4 – Growth, Learning & Performance
  {
    id: "q16",
    pillar: "Growth, Learning & Performance",
    text: "Employees have clear opportunities for career development and growth",
  },
  {
    id: "q17",
    pillar: "Growth, Learning & Performance",
    text: "Our organization invests in training and skill development programs",
  },
  {
    id: "q18",
    pillar: "Growth, Learning & Performance",
    text: "Performance is measured fairly and constructively across all levels",
  },
  {
    id: "q19",
    pillar: "Growth, Learning & Performance",
    text: "Recognition and rewards are given fairly based on contribution and effort",
  },
  {
    id: "q20",
    pillar: "Growth, Learning & Performance",
    text: "Learning from mistakes is encouraged rather than punished",
  },

  // Pillar 5 – Trust, Communication & Clarity
  {
    id: "q21",
    pillar: "Trust, Communication & Clarity",
    text: "Communication between all levels of the organization is open and honest",
  },
  {
    id: "q22",
    pillar: "Trust, Communication & Clarity",
    text: "Employees understand their roles, responsibilities, and expectations clearly",
  },
  {
    id: "q23",
    pillar: "Trust, Communication & Clarity",
    text: "Information is shared transparently across the organization",
  },
  {
    id: "q24",
    pillar: "Trust, Communication & Clarity",
    text: "Trust exists between employees and management at all levels",
  },
  {
    id: "q25",
    pillar: "Trust, Communication & Clarity",
    text: "Conflicts are resolved fairly and constructively when they arise",
  },
];

export default function InternalAssessmentPage() {
  const [answers, setAnswers] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  function handleChange(questionId, value) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: Number(value),
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!allAnswered) {
      setSubmitError("Please answer all questions before saving.");
      setSubmitSuccess(false);
      return;
    }
    setSubmitError("");
    setSubmitSuccess(true);

    // NOTE: In the real system this is where you'd POST to your API
    // and let Supabase update scores + ROI.
  }

  // Group by pillar in a nice order
  const questionsByPillar = PILLAR_ORDER.map((pillarName) => ({
    pillar: pillarName,
    items: QUESTIONS.filter((q) => q.pillar === pillarName),
  })).filter((group) => group.items.length > 0);

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
          across the five HRI pillars. Rate each statement from 1 (Never)
          to 5 (Always). In the full platform, these responses will convert
          into 0–100 scores per pillar and feed straight into your HRI
          dashboard and ROI view.
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

      {submitSuccess && (
        <div
          style={{
            marginBottom: 16,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #22C55E",
            background: "#052e16",
            color: "#BBF7D0",
            fontSize: 13,
          }}
        >
          Assessment saved (demo). In the live HRI platform, these scores
          will update your dashboard and ROI calculations automatically.
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {questionsByPillar.map((group) => (
            <section
              key={group.pillar}
              style={{
                borderRadius: 16,
                border: "1px solid #1F2937",
                padding: 16,
                background:
                  "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#F9FAFB",
                    marginBottom: 2,
                  }}
                >
                  {group.pillar}
                </h2>
                <p
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    maxWidth: 520,
                  }}
                >
                  Score each statement based on how true it feels today in
                  your organisation.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {group.items.map((q) => {
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
                          fontSize: 13,
                          color: "#E5E7EB",
                          marginBottom: 8,
                        }}
                      >
                        {q.text}
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
                                handleChange(q.id, e.target.value)
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
          disabled={!allAnswered}
          style={{
            padding: "10px 18px",
            borderRadius: 999,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: allAnswered ? "pointer" : "not-allowed",
            background: allAnswered ? "#FACC15" : "#4B5563",
            color: "#111827",
            opacity: allAnswered ? 1 : 0.7,
          }}
        >
          Save internal assessment
        </button>
      </form>
    </div>
  );
}
