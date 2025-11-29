"use client";

import { useEffect, useState } from "react";

export default function EmployeePulsePage() {
  const [pulse, setPulse] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPulse() {
    try {
      const res = await fetch("/api/overview", { cache: "no-store" });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error || "Could not load pulse data");
        setLoading(false);
        return;
      }

      setPulse(json.pulse_summary || []);
      setAssessment(json.scores || []);
      setLoading(false);
    } catch (err) {
      setError("Network error loading pulse");
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPulse();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* PAGE HEADER */}
      <section>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Employee Pulse
        </h1>
        <p style={{ fontSize: 13, opacity: 0.8, maxWidth: 600 }}>
          Quick, anonymous sentiment check across the five HRI pillars –
          compared directly with your internal assessment.
        </p>
      </section>

      {/* MAIN PANEL */}
      <div
        style={{
          background: "#0b1120",
          padding: 22,
          borderRadius: 18,
          border: "1px solid rgba(148,163,184,0.3)",
          boxShadow: "0 18px 40px rgba(15,23,42,0.5)",
        }}
      >
        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading pulse…</p>
        ) : error ? (
          <p style={{ color: "#f87171" }}>{error}</p>
        ) : !pulse || pulse.length === 0 ? (
          <p style={{ opacity: 0.7 }}>
            No pulse data yet. Run your first employee pulse to see results
            here.
          </p>
        ) : (
          <>
            {/* OVERALL SCORE */}
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                Overall Pulse Score
              </h2>
              <p style={{ fontSize: 40, fontWeight: 700, color: "#FEE000" }}>
                {Math.round(
                  pulse.reduce((sum, p) => sum + p.score, 0) / pulse.length
                )}
                <span style={{ fontSize: 22, opacity: 0.7 }}> / 100</span>
              </p>
            </div>

            {/* GRID OF PILLARS */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 16,
              }}
            >
              {pulse.map((p) => {
                const assessmentMatch = assessment.find(
                  (a) => a.pillar === p.pillar
                );

                const assessScore = assessmentMatch?.score ?? null;
                const diff = assessScore ? p.score - assessScore : null;

                return (
                  <div
                    key={p.pillar}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      padding: 18,
                      borderRadius: 14,
                      border: "1px solid rgba(148,163,184,0.28)",
                    }}
                  >
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
                      {p.pillar}
                    </h3>

                    <p
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        marginBottom: 4,
                        color: "#FEE000",
                      }}
                    >
                      {Math.round(p.score)}
                    </p>

                    {assessScore !== null && (
                      <p style={{ fontSize: 12, opacity: 0.8 }}>
                        Internal assessment:{" "}
                        <strong style={{ color: "#fff" }}>{assessScore}</strong>
                      </p>
                    )}

                    {diff !== null && (
                      <p
                        style={{
                          fontSize: 12,
                          marginTop: 6,
                          color: diff >= 0 ? "#4ade80" : "#f87171",
                        }}
                      >
                        {diff >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(Math.round(diff))}{" "}
                        {diff >= 0 ? "higher than assessment" : "lower than assessment"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
