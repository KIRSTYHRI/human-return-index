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
  const [trace, setTrace] = useState([]);

  function t(line) {
    setTrace((prev) => [line, ...prev].slice(0, 30));
  }

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    setTrace([]);
    t("SUBMIT ✅");

    try {
      const supabase = supabaseBrowser();
      t("supabaseBrowser() OK");

      if (!email) throw new Error("Enter your email");

      if (mode === "password") {
        if (!password) throw new Error("Enter your password");

        t("Calling signInWithPassword...");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        t(`signIn error: ${error ? error.message : "(none)"}`);
        t(`signIn user: ${data?.user ? "YES" : "NO"}`);
        t(`signIn session: ${data?.session ? "YES" : "NO"}`);

        // Immediately check session + storage
        const sess = await supabase.auth.getSession();
        t(`getSession error: ${sess.error ? sess.error.message : "(none)"}`);
        t(`getSession session: ${sess.data?.session ? "YES" : "NO"}`);

        const ls = localStorage.getItem("hri-auth");
        t(`localStorage[hri-auth]: ${ls ? "SET" : "NULL"}`);

        if (error) throw error;

        if (!data?.session) {
          // This is the key clue
          setMsg(
            "No session returned. This usually means the user is not confirmed in Supabase Auth, or password login is blocked."
          );
          setLoading(false);
          return;
        }

        setMsg("Login OK ✅ Going to dashboard...");
        window.location.assign("/dashboard");
        return;
      }

      // Magic link mode
      t("Calling signInWithOtp...");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      t(`otp error: ${error ? error.message : "(none)"}`);
      if (error) throw error;

      setMsg("Magic link sent. Check inbox/spam.");
    } catch (err) {
      setMsg(err?.message || "Login failed");
      t(`CATCH: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Log in (TRUTH TEST ✅)</h1>

        <div style={{ padding: 12, border: "1px solid #333", borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Debug (remove later)</div>
          <div>URL: {envDebug.url || "(missing)"}</div>
          <div>ANON starts: {envDebug.anonStart ? `${envDebug.anonStart}…` : "(missing)"}</div>
          <div style={{ marginTop: 10, fontWeight: 800 }}>Trace (latest 30)</div>
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

          <button disabled={loading}>{loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}</button>

          {msg && (
            <div style={{ marginTop: 8 }}>
              <strong>{msg}</strong>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
