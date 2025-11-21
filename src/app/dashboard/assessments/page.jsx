"use client";

import { useEffect, useState } from "react";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Assessments
        </h1>
        <p style={{ opacity: 0.8 }}>Loading your assessments…</p>
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
          color: "crimson",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Human Return Index™ – Assessments
        </h1>
        <p>Something went wrong:</p>
        <pre style={{ whiteSpace: "pre-wrap" }}>{error}</pre>
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
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Human Return Index™ – Assessments
      </h1>
      <p style={{ marginBottom: 24, opacity: 0.8 }}>
        Every assessment you run appears here. Click into any row to view its
        scores and ROI impact.
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
                <Th>Current?</Th>
                <Th></Th>
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
                  <Td>{a.is_current ? "✅ Yes" : "—"}</Td>
                  <Td style={{ textAlign: "right" }}>
  <a
    href={`/dashboard/assessments/${a.id}`}
    style={{
      fontSize: 13,
      textDecoration: "underline",
      opacity: 0.8,
    }}
  >
    View assessment
  </a>
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

function Th({ children }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        borderBottom: "1px solid #eee",
        fontWeight: 600,
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }) {
  return (
    <td
      style={{
        padding: "10px 12px",
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}
