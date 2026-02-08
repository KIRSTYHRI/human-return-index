"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [trace, setTrace] = useState([]);

  const DEBUG_MODE = true; // keep true until stable

  function addTrace(line) {
    setTrace((t) => [line, ...t].slice(0, 30));
    console.log("[LOGIN TRACE]", line);
  }

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  useEffect(() => {
    const supabase = supabaseBrowser();

    supabase.auth.getSession().then(({ data, error }) => {
      addTrace(`initial getSession error=${error ? error.message : "none"}`);
      addTrace(`initial hasSession=${!!data?.session}`);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      addTrace(`onAuthStateChange: ${event} | hasSession=${!!session}`);
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return; // prevent double submit

    setMsg("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      if (!email) throw new Error("Enter your email");

      if (mode === "password") {
        if (!password) throw new Error("Enter your password");

        addTrace("Calling signInWithPassword...");
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({ email, password });

        addTrace(`loginError=${loginError ? loginError.message : "none"}`);
        addTrace(`loginData.session=${!!loginData?.session}`);

        if (loginError) throw loginError;

        // ✅ DO NOT call getSession here (this is what keeps getting aborted)
        if (!loginData?.session) {
          setMsg("Login returned no session object (unexpected).");
          addTrace("No session on loginData");
          return;
        }

        // Check localStorage after login
        const ls = localStorage.getItem("hri-sb-auth");
        addTrace(`localStorage hri-sb-auth = ${ls ? "SET" : "null"}`);

        setMsg("Login OK ✅ Redirecting to dashboard…");

        // Let state flush, then redirect
        setTimeout(() => {
          router.replace("/dashboard");
        }, DEBUG_MODE ? 600 : 0);

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

  async function signOut() {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    addTrace("Signed out");
    setMsg("Signed out");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
          Log in (TRACE VERSION ✅)
        </h1>

        <div style={{ padding: 10, border: "1px solid #333", borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Debug</div>
          <div>URL: {envDebug.url || "(missing)"}</div>
          <div>ANON starts: {envDebug.anonStart || "(missing)"}</div>
          <div>mode: {mode} | loading: {String(loading)}</div>
          <div>msg: {msg || "(empty)"}</div>
          <div style={{ marginTop: 10, fontWeight: 700 }}>Trace</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 6 }}>
            {trace.length ? trace.join("\n") : "(none yet)"}
          </pre>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={signOut}>Sign out</button>
          </div>
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
            autoComplete="email"
          />

          {mode === "password" && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          )}

          <button disabled={loading}>
            {loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}
          </button>
        </form>
      </section>
    </main>
  );
}
