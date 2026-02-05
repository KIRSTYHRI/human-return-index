"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [testOut, setTestOut] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("login_msg");
    if (saved) setMsg(saved);
  }, []);

  function setMsgPersist(text) {
    setMsg(text);
    window.localStorage.setItem("login_msg", text || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    setMsgPersist("SUBMIT FIRED ✅");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      if (!email) {
        setMsgPersist("Please enter your email");
        return;
      }

      if (mode === "password") {
        if (!password) {
          setMsgPersist("Please enter your password");
          return;
        }

        setMsgPersist("Attempting login…");

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setMsgPersist(`Login failed: ${error.message}`);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData?.session) {
          setMsgPersist("Login succeeded but session is missing.");
          return;
        }

        setMsgPersist("Login OK ✅ Redirecting...");
        setTimeout(() => window.location.assign("/dashboard"), 600);
        return;
      }

      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        setMsgPersist(`Magic link failed: ${error.message}`);
        return;
      }

      setMsgPersist("Magic link sent. Check your inbox (and spam).");
    } catch (err) {
      setMsgPersist(err?.message || "Login failed (catch)");
    } finally {
      setLoading(false);
    }
  }

  async function testSessionAndOrg() {
    setTestOut("Running test…");
    try {
      const supabase = supabaseBrowser();

      const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
      if (sessErr) throw sessErr;

      const token = sessionData?.session?.access_token;

      const result = {
        hasSession: !!sessionData?.session,
        tokenStart: token ? token.slice(0, 16) + "…" : null,
      };

      if (!token) {
        setTestOut(JSON.stringify({ ...result, api: "SKIPPED (no token)" }, null, 2));
        return;
      }

      const res = await fetch("/api/me/org", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const text = await res.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }

      setTestOut(
        JSON.stringify(
          {
            ...result,
            apiStatus: res.status,
            apiBody: parsed,
          },
          null,
          2
        )
      );
    } catch (e) {
      setTestOut(`Test failed: ${e?.message || String(e)}`);
    }
  }

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Log in</h1>

        <div style={{ padding: 10, background: "#fff6bf", border: "1px solid #000", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Debug (remove later)</div>
          <div><b>URL:</b> {String(envDebug.url)}</div>
          <div><b>ANON starts:</b> {envDebug.anonStart ? envDebug.anonStart + "…" : "(empty)"}</div>
          <div style={{ marginTop: 8 }}><b>mode:</b> {mode} | <b>loading:</b> {String(loading)}</div>
          <div><b>email length:</b> {email.length} | <b>password length:</b> {password.length}</div>
          <div><b>msg:</b> {msg || "(empty)"}</div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={testSessionAndOrg}>
              Test Session + /api/me/org
            </button>
            <button
              type="button"
              onClick={() => {
                window.localStorage.removeItem("login_msg");
                setMsg("");
                setTestOut("");
              }}
            >
              Clear
            </button>
          </div>

          {testOut && (
            <pre style={{ marginTop: 10, whiteSpace: "pre-wrap", fontSize: 12 }}>
              {testOut}
            </pre>
          )}
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
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" />

          {mode === "password" && (
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}
          </button>
        </form>
      </section>
    </main>
  );
}
