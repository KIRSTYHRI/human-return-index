"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../src/lib/apiFetch";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const [env, setEnv] = useState(null);
  const [error, setError] = useState("");

  const [tokenTest, setTokenTest] = useState(null);
  const [orgTest, setOrgTest] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setError("");
        const res = await fetch("/api/debug-env", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Failed to load env");
        setEnv(json);
      } catch (e) {
        setError(e?.message || "Unexpected error");
      }
    })();
  }, []);

  async function runTokenTest() {
    try {
      setTesting(true);
      setTokenTest(null);
      setError("");
      const res = await apiFetch("/api/debug-token", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      setTokenTest({ status: res.status, json });
    } catch (e) {
      setError(e?.message || "Token test failed");
    } finally {
      setTesting(false);
    }
  }

  async function runOrgTest() {
    try {
      setTesting(true);
      setOrgTest(null);
      setError("");
      const res = await apiFetch("/api/me/org", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      setOrgTest({ status: res.status, json });
    } catch (e) {
      setError(e?.message || "Org test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px", color: "#E5E7EB" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Settings</h1>
      <p style={{ fontSize: 14, color: "#9CA3AF", marginBottom: 18 }}>
        Internal debug view. Use the buttons below to verify auth token + org lookup.
      </p>

      {error && <p style={{ color: "#F97316", marginBottom: 12 }}>{error}</p>}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <button
          type="button"
          onClick={runTokenTest}
          disabled={testing}
          style={{
            cursor: testing ? "not-allowed" : "pointer",
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #FEE000",
            background: "#FEE000",
            color: "#111827",
            fontWeight: 900,
          }}
        >
          Test token header (/api/debug-token)
        </button>

        <button
          type="button"
          onClick={runOrgTest}
          disabled={testing}
          style={{
            cursor: testing ? "not-allowed" : "pointer",
            padding: "10px 14px",
            borderRadius: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "rgba(255,255,255,0.92)",
            fontWeight: 900,
          }}
        >
          Test org lookup (/api/me/org)
        </button>
      </div>

      {(tokenTest || orgTest) && (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#0B1220",
            border: "1px solid #1F2937",
            borderRadius: 12,
            padding: 16,
            fontSize: 12,
            color: "#E5E7EB",
            marginBottom: 16,
          }}
        >
{JSON.stringify({ tokenTest, orgTest }, null, 2)}
        </pre>
      )}

      {!error && !env && <p style={{ color: "#9CA3AF" }}>Loading env…</p>}

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
