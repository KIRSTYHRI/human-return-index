"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const DEBUG_MODE = true;

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState("Please log in.");
  const [debug, setDebug] = useState("");

  function trace(line) {
    console.log("[LOGIN]", line);
    setDebug((d) => (d ? d + "\n" + line : line));
  }

  // Dump current auth + storage state
  async function dumpAuth() {
    const keys = Object.keys(localStorage || {});
    const supa = keys.filter((k) => k.includes("sb-") || k.includes("hri-sb-auth"));

    trace("localStorage supabase keys: " + JSON.stringify(supa));

    const { data, error } = await supabase.auth.getSession();

    if (error) trace("getSession error: " + error.message);
    else trace("getSession hasSession=" + !!data?.session);
  }

  // Force logout
  async function signOut() {
    await supabase.auth.signOut();
    trace("SIGNED OUT ✅");

    const keys = Object.keys(localStorage || {});
    const supa = keys.filter((k) => k.includes("sb-") || k.includes("hri-sb-auth"));
    trace("post-signout keys: " + JSON.stringify(supa));
  }

  useEffect(() => {
    let alive = true;

    // Initial dump
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

    setMsg("Signed in ✅ Checking storage…");

    // Give storage time to write
    setTimeout(async () => {
      await dumpAuth();

      setMsg("Redirecting to dashboard…");

      setTimeout(() => {
        if (!DEBUG_MODE) router.replace("/dashboard");
      }, 2000);
    }, 600);
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28 }}>Login (Debug Mode)</h1>
      <p>{msg}</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10 }}
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10 }}
        />

        <button type="submit" style={{ padding: 10, fontWeight: 700 }}>
          Sign in
        </button>
      </form>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={dumpAuth} style={{ padding: 8 }}>
          Dump Auth
        </button>

        <button onClick={signOut} style={{ padding: 8 }}>
          Sign Out
        </button>
      </div>

      {debug && (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#eee",
            borderRadius: 8,
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {debug}
        </pre>
      )}
    </main>
  );
}
