"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/apiFetch";

export default function SettingsPage() {
  const [env, setEnv] = useState(null);
  const [error, setError] = useState("");
  const [authTest, setAuthTest] = useState(null);

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

  async function runAuthTest() {
    setAuthTest(null);
    try {
      const res = await apiFetch("/api/debug-token");
      const json = await res.json().catch(() => ({}));
      setAuthTest({ status: res.status, json });
    } catch (e) {
      setAuthTest({ error: e?.message || "Auth test failed" });
    }
  }

  async function runOrgTest() {
    setAuthTest(null);
    try {
      const res = await apiFetch("/api/me/org");
      const json = await res.json().catch(() => ({}));
      setAuthTest({ status: res.status, json });
    } catch (e) {
      setAuthTest({ error: e?.message || "Org test failed" });
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>Settings</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Internal debug view.
      </p>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={runAuthTest}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #FEE000", background: "#FEE000", color: "#111827", fontWeight: 900 }}
        >
          Test token header (/api/debug-token)
        </button>

        <button
          type="button"
          onClick={runOrgTest}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #FEE000", background: "#FEE000", color: "#111827", fontWeight: 900 }}
        >
          Test org (/api/me/org)
        </button>
      </div>

      {error && <p style={{ color: "#F97316" }}>{error}</p>}
      {!error && !env && <p style={{ color: "#9CA3AF" }}>Loading…</p>}

      {authTest && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#0B1220", border: "1px solid #1F2937", borderRadius: 12, padding: 16, fontSize: 12 }}>
          {JSON.stringify(authTest, null, 2)}
        </pre>
      )}

      {!error && env && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#0B1220", border: "1px solid #1F2937", borderRadius: 12, padding: 16, fontSize: 12 }}>
          {JSON.stringify(env, null, 2)}
        </pre>
      )}
    </main>
  );
}
