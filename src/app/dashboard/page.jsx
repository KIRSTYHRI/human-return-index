"use client";

import { useEffect, useState } from "react";

const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState(null); // latest pulse row
  const [hri, setHri] = useState(null); // latest hri_scores row
  const [error, setError] = useState("");
  const [recalcLoading, setRecalcLoading] = useState(false);

  async function loadDashboardData() {
    // 1) Latest pulse
    const res = await fetch(`/api/pulse-latest?organisation_id=${ORG_ID}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok || json.ok === false) {
      throw new Error(json?.error || "Failed to load latest pulse score");
    }
    setRow(json.data);

    // 2) Latest HRI score
    const hriRes = await fetch(`/api/hri-score?organisation_id=${ORG_ID}`, {
      cache: "no-store",
    });
    const hriJson = await hriRes.json();
    if (hriRes.ok && hriJson.ok !== false) {
      setHri(hriJson.data);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        await loadDashboardData();
      } catch (e) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRecalculate() {
    try {
      setRecalcLoading(true);
      setError("");

      // Trigger calculation (writes to hri_scores)
      const res = await fetch(`/api/calculate-hri`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || json.ok === false) {
        throw new Error(json?.error || "Failed to recalculate HRI");
      }

      // Refresh displayed data
      await loadDashboardData();
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setRecalcLoading(false);
    }
  }

  const pulsePct = row?.average_score
    ? Math.round((Number(row.average_score) / 5) * 100)
    : null;

  const hriPct = hri?.hri_score != null ? Math.round(Number(hri.hri_score)) : null;

  return (
    <main style={{ color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Overview</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Your latest Employee Pulse results + your overall HRI score (live test data).
      </p>

      {loading && <p style={{ color: "#9CA3AF" }}>Loading dashboard…</p>}

      {!loading && error && <p style={{ color: "#F97316" }}>{error}</p>}

      {!loading && !error && !row && (
        <p style={{ color: "#9CA3AF" }}>
          No scored submissions yet. Submit the Employee Pulse once and your score will show here.
        </p>
      )}

      {!loading && !error && row && (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <Card title="Human Return Index™" big>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
              {hriPct == null ? "—" : `${hriPct}%`}
            </div>

            <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>
              Employer {hri?.employer_score != null ? Number(hri.employer_score).toFixed(1) : "—"}% · Employee{" "}
              {hri?.employee_score != null ? Number(hri.employee_score).toFixed(1) : "—"}%
            </div>

            <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
              Badge: <b style={{ color: "#FEE000" }}>{hri?.badge || "—"}</b>
            </div>

            <div style={{ marginTop: 6, fontSize: 11, color: "#6B7280" }}>
              Updated: {hri?.updated_at ? new Date(hri.updated_at).toLocaleString() : "—"}
            </div>
          </Card>

          <Card title="HRI Pulse Score" big>
            <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1 }}>
              {pulsePct}%
            </div>
            <div style={{ color: "#9CA3AF", fontSize: 13, marginTop: 6 }}>
              Avg {Number(row.average_score).toFixed(1)} / 5 · Total {row.total_score} / 50
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF" }}>
              Latest: {new Date(row.submitted_at).toLocaleString()}
            </div>
          </Card>

          <Card title="Pillars (out of 5)">
            <Pillar label="Leadership & Culture" value={row.pillar_1_score} />
            <Pillar label="Workload & Burnout Risk" value={row.pillar_2_score} />
            <Pillar label="Psychological Safety" value={row.pillar_3_score} />
            <Pillar label="Growth & Development" value={row.pillar_4_score} />
            <Pillar label="Support & Connection" value={row.pillar_5_score} />
          </Card>

          {/* Guaranteed-visible Recalculate button (no header layout issues) */}
          <Card title="Actions">
            <button
              onClick={handleRecalculate}
              disabled={recalcLoading || loading}
              style={{
                width: "100%",
                background: "#FEE000",
                color: "#111827",
                border: "1px solid #EAB308",
                borderRadius: 12,
                padding: "12px 14px",
                fontWeight: 900,
                cursor: recalcLoading || loading ? "not-allowed" : "pointer",
                opacity: recalcLoading || loading ? 0.7 : 1,
              }}
            >
              {recalcLoading ? "Recalculating…" : "Recalculate HRI"}
            </button>

            <p style={{ marginTop: 10, fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>
              Click this after new Employer Assessment or Employee Pulse submissions to refresh your overall HRI score +
              badge.
            </p>
          </Card>
        </div>
      )}
    </main>
  );
}

function Card({ title, children, big }) {
  return (
    <section
      style={{
        border: "1px solid #1F2937",
        borderRadius: 14,
        padding: big ? 18 : 16,
        background: "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
      }}
    >
      <div style={{ fontSize: 12, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {title}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </section>
  );
}

function Pillar({ label, value }) {
  const v = value == null ? null : Number(value);
  const pct = v == null ? 0 : Math.round((v / 5) * 100);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
        <span style={{ color: "#E5E7EB" }}>{label}</span>
        <span style={{ color: "#9CA3AF" }}>{v == null ? "—" : v.toFixed(1)}</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "#111827", border: "1px solid #1F2937" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 999,
            background: "#FEE000",
          }}
        />
      </div>
    </div>
  );
}

