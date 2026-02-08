"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [trace, setTrace] = useState([]);

  function addTrace(line) {
    setTrace((t) => [line, ...t].slice(0, 30));
    console.log("[LOGIN TRACE]", line);
  }

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  function supaStorageKeys() {
    const keys = Object.keys(localStorage || {});
    return keys.filter((k) => k.includes("hri-sb-auth") || k.includes("sb-"));
  }

  async function dumpAuth(label = "dump") {
    try {
      addTrace(`[${label}] localStorage supabase keys = ${JSON.stringify(supaStorageKeys())}`);

      const { data, error } = await supabase.auth.getSession();
      addTrace(`[${label}] getSession error = ${error ? error.message : "none"}`);
      addTrace(`[${label}] getSession hasSession = ${!!data?.session}`);

      if (data?.session) {
        addTrace(`[${label}] user = ${data.session.user?.id || "unknown"}`);
      }
    } catch (e) {
      addTrace(`[${label}] dumpAuth exception = ${String(e?.message || e)}`);
    }
  }

  useEffect(() => {
    // On load, show current state (proves persistence)
    dumpAuth("onload");

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      addTrace(`onAuthStateChange: ${event} | hasSession=${!!session}`);
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    setTrace([]);

    try {
      addTrace("Submit fired");

      if (!email) throw new Error("Enter your email");
      if (!password) throw new Error("Enter your password");

      addTrace("Calling signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      addTrace(`signIn error = ${error ? error.message : "none"}`);
      addTrace(`signIn hasSession = ${!!data?.session}`);

      // Give storage a moment to write
      setTimeout(async () => {
        await dumpAuth("post-login");

        const { data: s } = await supabase.auth.getSession();
        if (!s?.session) {
          setMsg("Signed in event fired, but session not readable after login. Persistence still broken.");
          setLoading(false);
          return;
        }

        setMsg("Login OK ✅ Redirecting to dashboard…");
        router.replace("/dashboard"); // better than window.location.href
        setLoading(false);
      }, 600);
    } catch (err) {
      setMsg(err?.message || "Login failed");
      addTrace(`Caught error: ${err?.message || "unknown"}`);
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setMsg("");
    addTrace("Signing out...");
    await supabase.auth.signOut();
    await dumpAuth("post-signout");
    setMsg("Signed out ✅");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 540 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 10 }}>
          Login (DEBUG + STORAGE CHECK)
        </h1>

        <div style={{ padding: 10, border: "1px solid #333", borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Debug</div>
          <div>URL: {envDebug.url || "(missing)"}</div>
          <div>ANON starts: {envDebug.anonStart || "(missing)"}</div>
          <div>loading: {String(loading)}</div>
          <div>msg: {msg || "(empty)"}</div>

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button type="button" onClick={() => dumpAuth("manual")} style={{ flex: 1 }}>
              Dump Auth
            </button>
            <button type="button" onClick={handleSignOut} style={{ flex: 1 }}>
              Sign Out
            </button>
          </div>

          <div style={{ marginTop: 10, fontWeight: 700 }}>Trace (latest 30)</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, marginTop: 6 }}>
            {trace.length ? trace.join("\n") : "(none yet)"}
          </pre>
        </div>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <button disabled={loading}>{loading ? "Working…" : "Log in"}</button>
        </form>
      </section>
    </main>
  );
}
