"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Build once (prevents accidental multiple clients)
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("Please log in.");
  const [debug, setDebug] = useState("");

  // If user already has a session, go straight to dashboard
  useEffect(() => {
    let alive = true;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      if (error) {
        setDebug(`getSession error: ${error.message}`);
        return;
      }

      if (data?.session) {
        setMsg("Session already active ✅ Redirecting…");
        router.replace("/dashboard");
      }
    })();

    // Listen for auth events (useful for debugging)
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      setDebug(`onAuthStateChange: ${event} | hasSession=${!!session}`);
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

    try {
      // Optional: support magic redirect target like /login?next=/dashboard
      const next = searchParams.get("next") || "/dashboard";

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg("Login failed ❌");
        setDebug(error.message);
        setLoading(false);
        return;
      }

      setMsg("Login OK ✅ Checking persistence…");

      // Give storage a moment to populate
      setTimeout(() => {
        const keys = Object.keys(localStorage || {});
        const supaKeys = keys.filter((k) => k.includes("sb-") || k.includes("hri-sb-auth"));
        setDebug((d) => `${d}\nlocalStorage supabase keys: ${JSON.stringify(supaKeys)}`);
      }, 250);

      setTimeout(async () => {
        const { data: sData, error: sErr } = await supabase.auth.getSession();
        if (sErr) {
          setMsg("Session read failed ❌");
          setDebug((d) => `${d}\ngetSession after login error: ${sErr.message}`);
          setLoading(false);
          return;
        }

        if (!sData?.session) {
          setMsg("No session after login ❌");
          setDebug((d) => `${d}\nSession object is null after login.`);
          setLoading(false);
          return;
        }

        setMsg("Session persisted ✅ Redirecting…");
        router.replace(next);
      }, 500);
    } catch (err) {
      setMsg("Login crashed ❌");
      setDebug(String(err?.message || err));
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Log in</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>{msg}</p>

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
            fontWeight: 600,
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
