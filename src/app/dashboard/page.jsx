"use client";

import { useEffect, useState } from "react";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function run() {
      try {
        // 1) Get org for logged-in user
        const resOrg = await fetch("/api/me/org", { cache: "no-store" });

        if (resOrg.status === 401) {
          // not logged in (or session cookie missing)
          window.location.href = "/login";
          return;
        }

        const orgJson = await resOrg.json();
        if (!resOrg.ok) throw new Error(orgJson?.error || "Failed to load organisation");

        if (!orgJson?.organisation_id) {
          throw new Error("Missing organisation_id (user not linked to an organisation yet)");
        }

        setOrg(orgJson);

        // 2) Load latest pulse (optional – won’t crash page if it errors)
        const resPulse = await fetch("/api/pulse-latest", { cache: "no-store" });
        const pulseJson = await resPulse.json();

        if (resPulse.ok) setPulse(pulseJson);
        else console.warn("pulse-latest failed:", pulseJson);
      } catch (e) {
        setError(e?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading dashboard…</div>;

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Overview</h1>
        <p style={{ marginTop: 8 }}>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Overview</h1>
      <p style={{ marginTop: 6, opacity: 0.8 }}>
        Your latest Employee Pulse results + your overall HRI score (pilot environment).
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Your organisation</h2>
        <div style={{ marginTop: 8, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
          <div><b>Organisation ID:</b> {org.organisation_id}</div>
          <div><b>Role:</b> {org.role}</div>
          <div><b>User ID:</b> {org.user_id}</div>
        </div>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Latest pulse</h2>
        <div style={{ marginTop: 8, padding: 12, border: "1px solid #333", borderRadius: 10 }}>
          {pulse ? (
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(pulse, null, 2)}</pre>
          ) : (
            <p style={{ margin: 0, opacity: 0.8 }}>No pulse data yet (or endpoint not ready).</p>
          )}
        </div>
      </section>
    </main>
  );
}
