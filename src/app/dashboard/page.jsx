"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/me/org", { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load organisation");
        }

        const data = await res.json();
        setOrg(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, []);

  if (loading) return <p>Loading dashboard…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Overview</h1>

      <pre style={{ background: "#111", color: "#0f0", padding: "1rem" }}>
        {JSON.stringify(org, null, 2)}
      </pre>
    </main>
  );
}
