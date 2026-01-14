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
        console.log("ME/ORG:", data);
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

  if (loading) {
    return <p>Loading dashboard…</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!org?.organisation_id) {
    return <p>No organisation linked to this account.</p>;
  }

  return (
    <main>
      <h1>Overview</h1>
      <p>
        Your latest Employee Pulse results + your overall HRI score (pilot
        environment).
      </p>

      <pre style={{ marginTop: 20 }}>
        Organisation ID: {org.organisation_id}
      </pre>
    </main>
  );
}

