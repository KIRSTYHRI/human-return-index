"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("Please log in.");
  const [debug, setDebug] = useState("");

  function trace(line) {
    console.log("[LOGIN]", line);
    setDebug((d) => (d ? `${d}\n${line}` : line));
  }

  async function dumpAuth() {
    const keys = Object.keys(localStorage || {});
    const supaKeys = keys.filter((k) => k.includes("sb-") || k.includes("hri-sb-auth"));
    trace("localStorage supabase keys: " + JSON.stringify(supaKeys));

    const { data, error } = await supabase.auth.getSession();
    if (error) trace("getSession error: " + error.message);
    else trace("getSession hasSession=" + !!data?.session);
  }

  async function signOut() {
    await supabase.auth.signOut();
    trace("SIGNED OUT ✅");
    await dumpAuth();
    setMsg("Signed out ✅");
  }

  useEffect(() => {
    let alive = true;

    // Always dump state on load so we can see persistence even if already signed in
    dumpAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      trace(`onAuthStateChange: ${event} | hasSession=${!!session}`);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("Signing in…");
    setDebug("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMsg("Login failed ❌");
      trace("signIn error: " + error.message);
      return;
    }

    setMsg("Signed in ✅ Checking storage + session…");

    // Give storage time to write
    setTimeout(async () => {
      await dumpAuth();
      setMsg("Check the debug box below 👇");
    }, 700);
  }

  return (
    <main style={{ maxWidth: 460, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>
        Login (Debug Mode)
      </h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>{msg}</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #333" }}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #333" }}
        />

        <button type="submit" style={{ padding: 12, borderRadius: 12, fontWeight: 800 }}>
          Sign in
        </button>
      </form>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          type="button"
          onClick={dumpAuth}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #333", fontWeight: 700 }}
        >
          Dump Auth
        </button>

        <button
          type="button"
          onClick={signOut}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #333", fontWeight: 700 }}
        >
          Sign Out
        </button>
      </div>

      {debug ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.06)",
            whiteSpace: "pre-wrap",
            fontSize: 12,
          }}
        >
          {debug}
        </pre>
      ) : null}
    </main>
  );
}

