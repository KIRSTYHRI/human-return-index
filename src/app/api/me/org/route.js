"use client";

import { useEffect, useState } from "react";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/me/org", { cache: "no-store" });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to load organisation");
        }

        const data = await res.json();
        console.log("ORG DATA:", data); // 👈 keep this for now
        setOrg(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOrg();
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <main>
      <h1>Overview</h1>
      <pre>{JSON.stringify(org, null, 2)}</pre>
    </main>
  );
}
