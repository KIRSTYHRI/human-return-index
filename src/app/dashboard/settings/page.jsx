"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    employee_count: "",
    avg_salary: "",
    turnover_rate: "",
    absent_days_per_employee: "",
    annual_wellbeing_spend: "",
    engagement_score: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load existing org metrics on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/org-metrics", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || !json.ok) {
          throw new Error(json.error || "Failed to load organisation metrics");
        }

        const m = json.org_metrics || {};

        setForm({
          employee_count: m.employee_count ?? "",
          avg_salary: m.avg_salary ?? "",
          turnover_rate: m.turnover_rate ?? "",
          absent_days_per_employee: m.absent_days_per_employee ?? "",
          annual_wellbeing_spend: m.annual_wellbeing_spend ?? "",
          engagement_score: m.engagement_score ?? "",
        });
      } catch (err) {
        console.error("Settings load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/org-metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to save settings");
      }

      setMessage(
        "Settings saved. Your dashboard and ROI calculations now use these numbers."
      );
    } catch (err) {
      console.error("Settings save error:", err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

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
        Human Return Index™ – Organisation inputs
      </h1>
      <p style={{ marginBottom: 8, opacity: 0.8 }}>
        These are the core people and cost inputs that power your HRI score and
        people risk model. Update them as your organisation changes.
      </p>
      <p style={{ marginBottom: 20, opacity: 0.8, fontSize: 13 }}>
        Tip: Start with best estimates. You can refine later – your dashboard
        will always use the latest saved figures.
      </p>

      {loading ? (
        <p>Loading settings…</p>
      ) : (
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 20,
            background: "#fafafa",
          }}
        >
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
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
                marginBottom: 16,
                padding: 12,
                borderRadius: 8,
                background: "#e7ffe9",
                color: "#115c1b",
                fontSize: 13,
              }}
            >
              {message}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <Field
              label="Total employees"
              description="How many employees are currently on your payroll?"
              type="number"
              value={form.employee_count}
              onChange={handleChange("employee_count")}
            />

            <Field
              label="Average salary (£)"
              description="Approximate average full-time equivalent salary."
              type="number"
              value={form.avg_salary}
              onChange={handleChange("avg_salary")}
            />

            <Field
              label="Annual turnover rate (%)"
              description="What percentage of staff leave in a typical year?"
              type="number"
              value={form.turnover_rate}
              onChange={handleChange("turnover_rate")}
            />

            <Field
              label="Absence days per employee (per year)"
              description="Average number of sick days per employee per year."
              type="number"
              step="0.1"
              value={form.absent_days_per_employee}
              onChange={handleChange("absent_days_per_employee")}
            />

            <Field
              label="Annual wellbeing / people investment (£)"
              description="What you invest per year in wellbeing, mental health, EAP, L&D etc."
              type="number"
              value={form.annual_wellbeing_spend}
              onChange={handleChange("annual_wellbeing_spend")}
            />

            <Field
              label="Engagement score (0–100)"
              description="If you run engagement surveys, what’s your latest overall score?"
              type="number"
              value={form.engagement_score}
              onChange={handleChange("engagement_score")}
            />

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  background: "#111",
                  color: "white",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : "Save inputs"}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

function Field({ label, description, type = "text", value, onChange, step }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        padding: 12,
        borderRadius: 10,
        background: "white",
        border: "1px solid #e5e5e5",
      }}
    >
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
      {description && (
        <span style={{ fontSize: 11, opacity: 0.7 }}>{description}</span>
      )}
      <input
        type={type}
        step={step}
        value={value}
        onChange={onChange}
        style={{
          marginTop: 4,
          padding: "8px 10px",
          borderRadius: 8,
          border: "1px solid #d0d0d0",
          fontSize: 13,
        }}
      />
    </div>
  );
}
