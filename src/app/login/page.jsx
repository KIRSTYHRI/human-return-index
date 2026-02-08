"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

const DEBUG_MODE = true; // 🔥 set false once fixed

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("Please log in.");
  const [debug, setDebug] = useState("");

  function trace(line) {
    console.log("[LOGIN TRACE]", line);
    setDebug((d) => (d ? `${d}\n${line}` : line));
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      if (error) {
        trace(`getSession error: ${error.message}`);
        return;
      }

      const has = !!data?.session;
      trace(`initial getSession hasSession=${has}`);

      // In debug mode, do NOT auto-redirect — we want to SEE persistence
      if (has && !DEBUG_MODE) {
        setMsg("Session already active ✅ Redirecting…");
        router.replace("/dashboard");
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      trace(`onAuthStateChange: ${event} | hasSession=${!!session}`);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe();
    };
  }, [router, supabase]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("Signing in…");
    setDebug("");

    const next = searchParams.get("next") || "/dashboard";

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg("Login failed ❌");
        trace(`signIn error: ${error.message}`);
        setLoading(false);
        return;
      }

      setMsg("Signed in ✅ Checking storage + session…");
      trace(`signIn ok user=${data?.user?.id || "unknown"}`);

      // Check localStorage keys shortly after login
      setTimeout(() => {
        const keys = Object.keys(localStorage || {});
        const supaKeys = keys.filter((k) => k.includes("sb-") || k.includes("hri-sb-auth"));
        trace(`localStorage supabase keys: ${JSON.stringify(supaKeys)}`);
      }, 300);

      // Check session after login
      setTimeout(async () => {
        const { data: sData, error: sErr } = await supabase.auth.getSession();
        if (sErr) {
          setMsg("Session check failed ❌");
          trace(`getSession after login error: ${sErr.message}`);
          setLoading(false);
          return;
        }

        const hasSession = !!sData?.session;
        trace(`getSession after login hasSession=${hasSession}`);

        if (!hasSession) {
          setMsg("No session after login ❌ (persistence still broken)");
          setLoading(false);
          return;
        }

        setMsg(DEBUG_MODE ? "Session OK ✅ (debug hold 3s)" : "Session OK ✅ Redirecting…");

        if (DEBUG_MODE) {
          setTimeout(() => router.replace(next), 3000);
        } else {
          router.replace(next);
        }
      }, 700);
    } catch (err) {
      setMsg("Login crashed ❌");
      trace(String(err?.message || err));
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Log in</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>{msg}</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333" }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #333" }}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "1px solid #333",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {debug ? (
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 12,
            background: "rgba(0,0,0,0.06)",
            overflowX: "auto",
            fontSize: 12,
            whiteSpace: "pre-wrap",
          }}
        >
          {debug}
        </pre>
      ) : null}
    </main>
  );
}
