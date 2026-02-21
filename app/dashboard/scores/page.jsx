"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

export const dynamic = "force-dynamic";

export default function ScoresPage() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await apiFetch("/api/overview");
        const json = await res.json();

        if (!res.ok || json.ok === false) {
          throw new Error(json?.error || "Failed to load overview");
        }

        setOverview(json?.overview || null);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    })();
  }, []);

  async function save(scores) {
    try {
      setError("");
      const res = await apiFetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.ok === false)) {
        throw new Error((json && json.error) || "Failed saving scores");
      }

      alert("Saved ✅");
    } catch (e) {
      console.error(e);
      setError(e.message);
    }
  }

  if (error) return <main style={{ padding: 24 }}><p style={{ color: "#ff6b6b" }}>{error}</p></main>;
  if (!overview) return <main style={{ padding: 24 }}><p>Loading…</p></main>;

  return (
    <main style={{ padding: 24 }}>
      <h1 className="pageTitle">Scores</h1>
      <pre className="card">{JSON.stringify(overview, null, 2)}</pre>

      {/* Call save(...) from your existing UI when ready */}
    </main>
  );
}
