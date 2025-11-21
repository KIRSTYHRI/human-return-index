"use client";

import { useEffect, useState } from "react";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assessments", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load assessments");
        }

        setAssessments(json.assessments || []);
      } catch (err) {
        console.error("Error loading assessments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          Assessments
        </h1>
        <p>Loading your assessments…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          padding: 24,
          fontFamily: "system-ui",
          maxWidth: 960,
          margin: "0 auto",
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>
          Assessments
        </h1>
        <p style={{ color: "crimson" }}>
          Something went wrong loading your assessments: {error}
        </p>
      </main>
    );
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
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        Assessments
      </h1>
      <p style={{ marginBottom: 20, opacity: 0.8 }}>
        This view shows all HRI assessments for your organisation. Right now
        it&apos;s just your Pilot Test, but as you add more, they&apos;ll show
        here with status, period, and overall HRI score.
      </p>

      {assessments.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No assessments found yet.</p>
      ) : (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Period</Th>
                <Th>Created</Th>
                <Th>Badge</Th>
                <Th style={{ textAlign: "right", paddingRight: 16 }}>
                  Overall HRI
                </Th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} style={{ borderTop: "1px solid #f2f2f2" }}>
                  <Td>{a.title}</Td>
                  <Td>{a.status}</Td>
                  <Td>
                    {a.period_start} → {a.period_end}
                  </Td>
                  <Td>
                    {a.created_at
                      ? new Date(a.created_at).toLocaleDateString()
                      : "-"}
                  </Td>
                  <Td>{a.badge_level || "—"}</Td>
                  <Td style={{ textAlign: "right", paddingRight: 16 }}>
                    {a.overall_score != null
                      ? Math.round(a.overall_score)
                      : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

// Tiny helper components for table cells
function Th({ children, style }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontWeight: 600,
        borderBottom: "1px solid #eee",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }) {
  return (
    <td
      style={{
        padding: "10px 12px",
        verticalAlign: "top",
        ...style,
      }}
    >
      {children}
    </td>
  );
}
