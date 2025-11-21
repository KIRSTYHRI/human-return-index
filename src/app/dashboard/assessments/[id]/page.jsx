"use client";

import { useEffect, useState, useMemo } from "react";

export default function AssessmentDetailPage({ params }) {
  const { id } = params || {};
  const [assessment, setAssessment] = useState(null);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/assessments/${id}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load assessment");
        }

        setAssessment(json.assessment || null);
        setScores(json.scores || []);
      } catch (err) {
        console.error("Error loading assessment detail:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Derive some nice extras from scores
  const { overallScore, highest, lowest } = useMemo(() => {
    const numericScores = (scores || [])
      .map((s) => Number(s.score))
      .filter((n) => Number.isFinite(n));

    if (!numericScores.length) {
      return { overallScore: null, highest: null, lowest: null };
    }

    const overall =
      numericScores.reduce((sum, n) => sum + n, 0) / numericScores.length;

    let high = null;
    let low = null;

    (scores || []).forEach((s) => {
      const val = Number(s.score);
      if (!Number.isFinite(val)) return;

      if (!high || val > high.score) high = { pillar: s.pillar, score: val };
      if (!low || val < low.score) low = { pillar: s.pillar, score: val };
    });

    return { overallScore: overall, highest: high, lowest: low };
  }, [scores]);

  if (loading) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 1040,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          HRI Assessment
        </h1>
        <p style={{ opacity: 0.8 }}>Loading assessment details…</p>
      </main>
    );
  }

  if (error || !assessment) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 1040,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          <a
            href="/dashboard/assessments"
            style={{
              textDecoration: "none",
              color: "#111",
              opacity: 0.8,
            }}
          >
            ← Back to assessments
          </a>
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          HRI Assessment
        </h1>
        <p style={{ color: "crimson", marginTop: 8 }}>
          Something went wrong loading this assessment:
        </p>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>{error}</pre>
      </main>
    );
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 1040,
        margin: "0 auto",
        background: "#ffffff",
      }}
    >
      {/* Back link */}
      <div style={{ marginBottom: 16, fontSize: 13 }}>
        <a
          href="/dashboard/assessments"
          style={{
            textDecoration: "none",
            color: "#111",
            opacity: 0.8,
          }}
        >
          ← Back to assessments
        </a>
      </div>

      {/* Page title */}
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            marginBottom: 4,
          }}
        >
          HRI Assessment – Detail
        </h1>
        <p style={{ opacity: 0.8, fontSize: 14, maxWidth: 640 }}>
          Full breakdown of this Human Return Index™ assessment, including
          pillar scores and key context so you can see where risk – and
          opportunity – really sits.
        </p>
      </header>

      {/* HERO CARD – yellow brand style */}
      <section
        style={{
          borderRadius: 16,
          border: "1px solid #f2e48b",
          background:
            "linear-gradient(135deg, #fffbe6 0%, #fffef6 40%, #ffffff 100%)",
          padding: 20,
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: 0.7,
              marginBottom: 4,
            }}
          >
            Assessment
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>
            {assessment.title}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <StatusPill status={assessment.status} />
            {assessment.is_current && (
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: "#111",
                  color: "#fff",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Current assessment
              </span>
            )}
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <div>
              <strong>Period:</strong> {assessment.period_start} →{" "}
              {assessment.period_end}
            </div>
            <div>
              <strong>Created:</strong>{" "}
              {assessment.created_at
                ? new Date(assessment.created_at).toLocaleDateString()
                : "-"}
            </div>
            <div>
              <strong>Badge:</strong>{" "}
              {assessment.badge_level || "No badge awarded"}
            </div>
          </div>
        </div>

        {/* Overall score block */}
        <div
          style={{
            minWidth: 220,
            padding: 14,
            borderRadius: 14,
            border: "1px solid #111",
            background: "#fff",
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: 0.6,
              marginBottom: 4,
            }}
          >
            Overall HRI score
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>
            {overallScore != null ? Math.round(overallScore) : "–"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
            Average across all pillars in this assessment.
          </div>
        </div>
      </section>

      {/* TWO-COLUMN SUMMARY */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.5fr)",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Strengths / risks */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #eee",
            padding: 16,
            background: "#fafafa",
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Strengths & risk signals
          </h2>
          {highest && lowest ? (
            <div style={{ fontSize: 13, opacity: 0.9 }}>
              <p style={{ marginBottom: 6 }}>
                <strong>Strongest pillar:</strong>{" "}
                <span style={{ fontWeight: 700 }}>{highest.pillar}</span> (
                {Math.round(highest.score)}/100)
              </p>
              <p style={{ marginBottom: 6 }}>
                <strong>Weakest pillar:</strong>{" "}
                <span style={{ fontWeight: 700 }}>{lowest.pillar}</span> (
                {Math.round(lowest.score)}/100)
              </p>
              <p style={{ marginTop: 6, opacity: 0.8 }}>
                This is where your Human Return Index™ starts to tell the story:
                where risk sits, where leadership is working, and where your
                next investment should go.
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 13, opacity: 0.75 }}>
              Once you have pillar scores, we’ll highlight your strongest and
              weakest areas here.
            </p>
          )}
        </div>

        {/* Meta box */}
        <div
          style={{
            borderRadius: 14,
            border: "1px solid #eee",
            padding: 16,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Assessment meta
          </h2>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            <p>
              <strong>Assessment ID:</strong> {assessment.id}
            </p>
            <p>
              <strong>Status:</strong> {assessment.status}
            </p>
            <p>
              <strong>Current?</strong>{" "}
              {assessment.is_current ? "Yes – used on main dashboard" : "No"}
            </p>
          </div>
          {/* Placeholder for future CTAs */}
          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
            Coming soon: mark as current, archive, duplicate, and export.
          </div>
        </div>
      </section>

      {/* PILLAR GRID – branded cards */}
      <section style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          Pillar scores
        </h2>
        {scores.length === 0 ? (
          <p style={{ fontSize: 13, opacity: 0.75 }}>
            No pillar scores recorded for this assessment yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))",
              gap: 14,
            }}
          >
            {scores.map((s) => {
              const val = Number(s.score);
              const isHigh =
                highest && s.pillar === highest.pillar && val === highest.score;
              const isLow =
                lowest && s.pillar === lowest.pillar && val === lowest.score;

              let border = "#eee";
              let bg = "#ffffff";
              if (isHigh) {
                border = "#20a35b";
                bg = "#f3fff7";
              } else if (isLow) {
                border = "#f0a54a";
                bg = "#fff9f0";
              }

              return (
                <div
                  key={s.pillar}
                  style={{
                    border: `1px solid ${border}`,
                    borderRadius: 12,
                    padding: 12,
                    background: bg,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      opacity: 0.7,
                      marginBottom: 4,
                    }}
                  >
                    {s.pillar}
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      lineHeight: 1.1,
                    }}
                  >
                    {Number.isFinite(val) ? Math.round(val) : "–"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.75,
                      marginTop: 4,
                    }}
                  >
                    Score out of 100 for this pillar in this assessment.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FUTURE ROI / PULSE AREA */}
      <section
        style={{
          borderRadius: 16,
          border: "1px dashed #ddd",
          padding: 16,
          background: "#fafafa",
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        <strong>What’s next for this screen?</strong>
        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
          <li>Assessment-level ROI breakdown (linked to org metrics)</li>
          <li>Pulse-check insights for this assessment window</li>
          <li>Export-ready view for leadership and board reports</li>
        </ul>
      </section>
    </main>
  );
}

function StatusPill({ status }) {
  if (!status) return null;

  const normalised = String(status).toUpperCase();
  let bg = "#eee";
  let color = "#111";
  let label = status;

  if (normalised === "OPEN") {
    bg = "#e9fff1";
    color = "#0a7a3f";
    label = "Open";
  } else if (normalised === "CLOSED") {
    bg = "#f2f2f2";
    color = "#555";
    label = "Closed";
  } else if (normalised === "DRAFT") {
    bg = "#fff7e6";
    color = "#b26a00";
    label = "Draft";
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
        }}
      />
      {label}
    </span>
  );
}
