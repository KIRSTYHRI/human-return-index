"use client";
import { useEffect, useState } from "react";

export default function AssessmentsPage() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    period_start: "",
    period_end: "",
  });

  // Load existing assessments
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/assessments", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Error loading assessments");
        }
        setAssessments(data.assessments || []);
      } catch (err) {
        console.error("Load assessments error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Error creating assessment");
      }

      // Put the new one at the top
      setAssessments((prev) => [data.assessment, ...prev]);
      setMessage(
        "New assessment created. Your main dashboard will now use this as the latest cycle."
      );
      setForm({ title: "", period_start: "", period_end: "" });
    } catch (err) {
      console.error("Create assessment error:", err);
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
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        Assessments
      </h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Create and manage your Human Return Index™ assessment cycles. The most
        recently created assessment is what your main dashboard will show.
      </p>

      <a
        href="/dashboard"
        style={{
          display: "inline-block",
          marginBottom: 16,
          fontSize: 13,
          textDecoration: "underline",
        }}
      >
        ← Back to dashboard
      </a>

      {/* CREATE NEW ASSESSMENT */}
      <section
        style={{
          border: "1px solid #eee",
          borderRadius: 12,
          padding: 16,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Create new assessment
        </h2>
        <p style={{ fontSize: 13, opacity: 0.8, marginBottom: 12 }}>
          Use this when you start a new period – e.g. “Q1 2026”, “2026 Annual
          HRI Review”, or “Post-Intervention Follow Up”.
        </p>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: 8,
              borderRadius: 6,
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
              marginBottom: 12,
              padding: 8,
              borderRadius: 6,
              background: "#e7f8ea",
              color: "#135c26",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            <span style={{ fontWeight: 600 }}>Title</span>
            <span style={{ opacity: 0.7 }}>
              For example: “Q1 2026 HRI Assessment” or “2025 Pilot Review”.
            </span>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              style={{
                padding: 8,
                borderRadius: 8,
                border: "1px solid #ddd",
                fontSize: 14,
              }}
            />
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Period start</span>
              <input
                type="date"
                value={form.period_start}
                onChange={(e) =>
                  setForm((f) => ({ ...f, period_start: e.target.value }))
                }
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              />
            </label>

            <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
              <span style={{ fontWeight: 600 }}>Period end</span>
              <input
                type="date"
                value={form.period_end}
                onChange={(e) =>
                  setForm((f) => ({ ...f, period_end: e.target.value }))
                }
                style={{
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                  fontSize: 14,
                }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 8,
              padding: "8px 14px",
              borderRadius: 999,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              background: "#fee000",
            }}
          >
            {saving ? "Creating..." : "Create assessment"}
          </button>
        </form>
      </section>

      {/* EXISTING ASSESSMENTS LIST */}
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Existing assessments
        </h2>

        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading assessments…</p>
        ) : assessments.length === 0 ? (
          <p style={{ opacity: 0.7 }}>
            No assessments yet. Create your first one above.
          </p>
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
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#fafafa",
                    textAlign: "left",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <th style={{ padding: "8px 10px" }}>Title</th>
                  <th style={{ padding: "8px 10px" }}>Status</th>
                  <th style={{ padding: "8px 10px" }}>Period</th>
                  <th style={{ padding: "8px 10px" }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} style={{ borderTop: "1px solid #f3f3f3" }}>
                    <td style={{ padding: "8px 10px" }}>{a.title}</td>
                    <td style={{ padding: "8px 10px" }}>{a.status}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {a.period_start || "–"} → {a.period_end || "–"}
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      {a.created_at
                        ? new Date(a.created_at).toLocaleDateString()
                        : "–"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
