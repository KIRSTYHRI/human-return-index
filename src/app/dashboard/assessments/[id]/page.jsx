"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AssessmentDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/assessments/${id}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load assessment");
        }

        setData(json);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [id]);

  if (error) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui", color: "crimson" }}>
        <h1>Assessment details</h1>
        <p>Error loading assessment:</p>
        <pre>{error}</pre>
      </main>
    );
  }

  if (!data) {
    return (
      <main style={{ padding: 24, fontFamily: "system-ui" }}>
        <h1>Assessment details</h1>
        <p>Loading...</p>
      </main>
    );
  }

  const { assessment, scores } = data;

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <h1 style={{ marginBottom: 12, fontSize: 28, fontWeight: 800 }}>
        {assessment.title}
      </h1>

      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Created: {new Date(assessment.created_at).toLocaleDateString()} •
        Status: {assessment.status}
      </p>

      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Assessment period
        </h2>
        <p>
          {assessment.period_start} → {assessment.period_end}
        </p>

        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginTop: 16,
            marginBottom: 8,
          }}
        >
          Badge
        </h2>
        <p>{assessment.badge_level || "No badge awarded"}</p>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
          Pillar Scores
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
            gap: 12,
          }}
        >
          {scores.map((s) => (
            <div
              key={s.pillar}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ opacity: 0.7, fontSize: 12 }}>{s.pillar}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>
                {Math.round(Number(s.score))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
