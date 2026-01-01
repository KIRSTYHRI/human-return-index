"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [env, setEnv] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await fetch("/api/debug-env", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load env");
        setEnv(json);
      } catch (e) {
        setError(e?.message || "Unexpected error");
      }
    })();
  }, []);

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Settings</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Internal debug view. (We’ll make this pretty later.)
      </p>

      {error && <p style={{ color: "#F97316" }}>{error}</p>}

      {!error && !env && <p style={{ color: "#9CA3AF" }}>Loading…</p>}

      {!error && env && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#0B1220",
            border: "1px solid #1F2937",
            borderRadius: 12,
            padding: 16,
            fontSize: 12,
            color: "#E5E7EB",
          }}
        >
          {JSON.stringify(env, null, 2)}
        </pre>
      )}
    </main>
  );
}
