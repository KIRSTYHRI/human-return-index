"use client";

import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOrg() {
      try {
        const res = await fetch("/api/me/org", { cache: "no-store" });

        const contentType = res.headers.get("content-type") || "";
        const bodyText = await res.text();

        if (!res.ok) {
          throw new Error(bodyText || `Failed to load organisation (${res.status})`);
        }

        const data = contentType.includes("application/json") ? JSON.parse(bodyText) : bodyText;
        console.log("ORG DATA:", data);
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
    <main style={{ padding: 24 }}>
      <h1>Overview</h1>
      <pre>{JSON.stringify(org, null, 2)}</pre>
    </main>
  );
}
