"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/apiFetch"; // NOTE: correct for src/app/dashboard/*

export default function Page() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch("/api/overview");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Request failed");
        setData(json);
      } catch (e) {
        setErr(String(e?.message || e));
      }
    })();
  }, []);

  if (err) return <div style={{ padding: 16 }}>Error: {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Loading…</div>;

  return (
    <div style={{ padding: 16 }}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
