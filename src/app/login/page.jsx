"use client";

import { useState, useEffect } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [trace, setTrace] = useState([]);

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  function addTrace(line) {
    setTrace((t) => [line, ...t].slice(0, 20));
    console.log("[LOGIN TRACE]", line);
  }

  useEffect(() => {
    // listen for auth events
    const supabase = supabaseBrowser();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      addTrace(`onAuthStateChange: ${event} | hasSession=${!!session}`);
    });
    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();
      addTrace("Submit fired");

      if (!email) throw new Error("Enter your email");

      if (mode === "password") {
        if (!password) throw new Error("Enter your password");

        addTrace("Calling signInWithPassword...");
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({ email, password });

        addTrace(`loginError=${loginError ? loginError.message : "none"}`);
        addTrace(`loginData.session=${!!loginData?.session}`);

        // Force-check session AFTER login
        const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
        addTrace(`getSession error=${sessErr ? sessErr.message : "none"}`);
        addTrace(`getSession hasSession=${!!sessionData?.session}`);

        // Show whether localStorage got written
        addTrace(`localStorage hri-auth = ${localStorage.getItem("hri-auth") ? "SET" : "null"}`);

        if (loginError) throw loginError;

        if (!sessionData?.session) {
          setMsg(
            "Login returned NO session. This is usually: email not confirmed, auth settings, or wrong client. Check the trace box."
          );
          return;
        }

        setMsg("Login OK ✅ Session exists. Redirecting...");
        window.location.href = "/dashboard";
        return;
      }

      addTrace("Calling signInWithOtp...");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) throw error;

      setMsg("Magic link sent. Check inbox + spam.");
    } catch (err) {
      setMsg(err?.message || "Login failed");
      addTrace(`Caught error: ${err?.message || "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Log in</h1>

        <div style={{ padding: 10, border: "1px solid #333", borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Debug (remove later)</div>
          <div>URL: {envDebug.url || "(missing)"}</div>
          <div>ANON starts: {envDebug.anonStart || "(missing)"}</div>
          <div>mode: {mode} | loading: {String(loading)}</div>
          <div>msg: {msg || "(empty)"}</div>
          <div style={{ marginTop: 10, fontWeight: 700 }}>Trace (latest 20)</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 6 }}>
            {trace.length ? trace.join("\n") : "(none yet)"}
          </pre>
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

          <button disabled={loading}>
            {loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}
          </button>
        </form>
      </section>
    </main>
  );
}
