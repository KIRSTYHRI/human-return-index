"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

export default function OrgMetricsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    organisation_name: "",
    employees: "",
    avg_salary: "",
    turnover_rate: "",
    absence_days: "",
    wellbeing_spend: "",
    engagement_score: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await apiFetch("/api/org-metrics", { cache: "no-store" });
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          throw new Error(json?.error || "Failed to load organisation metrics");
        }

        const metrics = json?.metrics || {};

        setForm({
          organisation_name: metrics?.organisation_name ?? "",
          employees: metrics?.employees ?? "",
          avg_salary: metrics?.avg_salary ?? "",
          turnover_rate: metrics?.turnover_rate ?? "",
          absence_days: metrics?.absence_days ?? "",
          wellbeing_spend: metrics?.wellbeing_spend ?? "",
          engagement_score: metrics?.engagement_score ?? "",
        });

        setError(null);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load organisation metrics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMetrics();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await apiFetch("/api/org-metrics", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Failed to save organisation metrics");
      }

      setSuccess("Organisation data saved.");
      router.push("/dashboard/overview");
      router.refresh();
    } catch (e) {
      setError(e?.message || "Failed to save organisation metrics");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="shell">
      <div className="card">
        <div className="cardTop">
          <h2 className="cardTitle">Organisation Data</h2>
          <span className={`chip ${loading ? "chipMuted" : "chipLive"}`}>
            {loading ? "Loading…" : "PILOT"}
          </span>
        </div>

        <p className="pageSub" style={{ marginTop: 0 }}>
          Add your organisation inputs to generate your own financial risk and opportunity figures.
        </p>

        {error && <p className="errorText">{error}</p>}
        {success && <p style={{ color: "var(--yellow)", fontWeight: 700 }}>{success}</p>}

        <form onSubmit={handleSave} style={{ display: "grid", gap: 14 }}>
          <Field
            label="Organisation name"
            value={form.organisation_name}
            onChange={(v) => updateField("organisation_name", v)}
            placeholder="Your organisation"
          />

          <Field
            label="Employees"
            value={form.employees}
            onChange={(v) => updateField("employees", v)}
            placeholder="e.g. 260"
            type="number"
          />

          <Field
            label="Average salary (£)"
            value={form.avg_salary}
            onChange={(v) => updateField("avg_salary", v)}
            placeholder="e.g. 40000"
            type="number"
          />

          <Field
            label="Turnover rate (%)"
            value={form.turnover_rate}
            onChange={(v) => updateField("turnover_rate", v)}
            placeholder="e.g. 15"
            type="number"
            step="0.1"
          />

          <Field
            label="Absence days per employee"
            value={form.absence_days}
            onChange={(v) => updateField("absence_days", v)}
            placeholder="e.g. 6.6"
            type="number"
            step="0.1"
          />

          <Field
            label="Annual wellbeing spend (£)"
            value={form.wellbeing_spend}
            onChange={(v) => updateField("wellbeing_spend", v)}
            placeholder="e.g. 25000"
            type="number"
          />

          <Field
            label="Engagement score (/100)"
            value={form.engagement_score}
            onChange={(v) => updateField("engagement_score", v)}
            placeholder="e.g. 72"
            type="number"
          />

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button className="btnPrimary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save organisation data"}
            </button>

            <button
              type="button"
              className="btn"
              onClick={() => router.push("/dashboard/overview")}
            >
              Back to dashboard
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", step }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,.15)",
          background: "rgba(255,255,255,.04)",
          color: "inherit",
          outline: "none",
        }}
      />
    </label>
  );
}
