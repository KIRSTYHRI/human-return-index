"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      if (!email) throw new Error("Please enter your email");

      if (mode === "password") {
        if (!password) throw new Error("Please enter your password");

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

if (error) {
  setMsg(`Login failed: ${error.message}`);
  console.log("LOGIN ERROR:", error);
  return;
}

console.log("LOGIN OK:", data);

const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
console.log("SESSION:", sessionData, "SESSION_ERR:", sessionErr);

if (!sessionData?.session) {
  setMsg("Login succeeded but session is missing. Likely cookie/auth config issue.");
  return;
}

window.location.assign("/dashboard");

        window.location.assign("/dashboard");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) throw error;

      setMsg("Magic link sent. Check your inbox (and spam).");
    } catch (err) {
      setMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 460 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Log in</h1>

        {/* DEBUG BOX — REMOVE LATER */}
        <div style={{ padding: 10, background: "#fff6bf", border: "1px solid #000", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Debug (remove later)</div>
          <div><b>URL:</b> {String(envDebug.url)}</div>
          <div><b>ANON starts:</b> {envDebug.anonStart ? envDebug.anonStart + "…" : "(empty)"}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button type="button" onClick={() => setMode("password")} style={{ flex: 1 }}>
            Password
          </button>
          <button type="button" onClick={() => setMode("magic")} style={{ flex: 1 }}>
            Magic link
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
          />

          {mode === "password" && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          )}

          <button disabled={loading}>
            {loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}
          </button>

          {msg && <p style={{ marginTop: 6 }}>{msg}</p>}
        </form>
      </section>
    </main>
  );
}
