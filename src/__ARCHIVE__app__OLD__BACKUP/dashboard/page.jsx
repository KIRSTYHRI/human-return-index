"use client";

import { useEffect, useState } from "react";
import apiFetch from "@/lib/apiFetch";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const res = await apiFetch("/api/overview");
        const data = await res.json();

        if (cancelled) return;

        // ✅ ONLY treat 401 as real auth failure
        if (res.status === 401) {
          setError(data?.error || "Auth session missing!");
          setOverview(null);
          setLoading(false);
          return;
        }

        // ✅ 200 path (demo OR real user)
        if (data?.ok) {
          setOverview(data);
          setError(null);
          setLoading(false);
          return;
        }

        // Other unexpected error
        setError(data?.error || "Something went wrong loading dashboard.");
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError("Network error loading dashboard.");
        setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Do not show auth error during loading
  if (loading) {
    return null; // or spinner if you prefer
  }

  // ✅ If overview loaded (demo or real), show dashboard
  if (overview?.ok) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Human Return Index™ Dashboard</h1>

        {overview.demo && (
          <div style={{ marginBottom: "1rem", color: "#999" }}>
            DEMO MODE · Experience the Human Return Index™ pilot
          </div>
        )}

        <pre style={{ background: "#111", color: "#0f0", padding: "1rem" }}>
          {JSON.stringify(overview, null, 2)}
        </pre>
      </div>
    );
  }

  // ✅ Only show error if no valid overview loaded
  return (
    <div style={{ padding: "2rem", color: "red" }}>
      {error || "Unknown dashboard error."}
    </div>
  );
}
