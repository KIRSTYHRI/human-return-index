"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // A step log that persists across reloads
  const [trace, setTrace] = useState([]);

  useEffect(() => {
    const savedMsg = window.localStorage.getItem("login_msg");
    const savedTrace = window.localStorage.getItem("login_trace");
    if (savedMsg) setMsg(savedMsg);
    if (savedTrace) setTrace(JSON.parse(savedTrace));
  }, []);

  function pushTrace(line) {
    setTrace((prev) => {
      const next = [...prev, `${new Date().toISOString()} ${line}`].slice(-20);
      window.localStorage.setItem("login_trace", JSON.stringify(next));
      return next;
    });
  }

  function setMsgPersist(text) {
    setMsg(text);
    window.localStorage.setItem("login_msg", text || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    alert("✅ SUBMIT FIRED");
    pushTrace("A) submit fired");

    setLoading(true);
    pushTrace("B) setLoading(true)");

    try {
      const supabase = supabaseBrowser();
      pushTrace("C) got supabaseBrowser()");

      if (!email) {
        setMsgPersist("Please enter your email");
        pushTrace("D) missing email -> msg set");
        return;
      }

      if (mode === "password") {
        pushTrace("E) mode=password");

        if (!password) {
          setMsgPersist("Please enter your password");
          pushTrace("F) missing password -> msg set");
          return;
        }

        pushTrace("G) calling signInWithPassword...");
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        pushTrace(`H) signIn returned (error=${error ? "YES" : "NO"})`);

        if (error) {
          setMsgPersist(`Login failed: ${error.message}`);
          pushTrace(`I) set error msg: ${error.message}`);
          return;
        }

        pushTrace("J) fetching session...");
        const { data: sessionData, error: sessErr } = await supabase.auth.getSession();
        pushTrace(`K) getSession returned (session=${sessionData?.session ? "YES" : "NO"}) (err=${sessErr ? "YES" : "NO"})`);

        if (!sessionData?.session) {
          setMsgPersist("Login succeeded but session is missing (cookie/auth config issue).");
          pushTrace("L) session missing -> msg set");
          return;
        }

        setMsgPersist("Login OK ✅ Redirecting...");
        pushTrace("M) success msg set; redirecting");
        setTimeout(() => window.location.assign("/dashboard"), 800);
        return;
      }

      // magic link
      pushTrace("E2) mode=magic -> calling signInWithOtp...");
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });

      if (error) {
        setMsgPersist(`Magic link failed: ${error.message}`);
        pushTrace(`F2) magic link error msg set: ${error.message}`);
        return;
      }

      setMsgPersist("Magic link sent. Check your inbox (and spam).");
      pushTrace("G2) magic link sent msg set");
    } catch (err) {
      setMsgPersist(err?.message || "Login failed (catch)");
      pushTrace(`Z) catch: ${err?.message || "unknown"}`);
    } finally {
      setLoading(false);
      pushTrace("Y) finally setLoading(false)");
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 760 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Log in</h1>

        <div style={{ padding: 10, background: "#fff6bf", border: "1px solid #000", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Debug (remove later)</div>
          <div><b>URL:</b> {supabaseUrl || "❌ missing"}</div>
          <div><b>ANON starts:</b> {anonKey ? anonKey.slice(0, 12) + "…" : "❌ missing"}</div>
          <div style={{ marginTop: 8 }}><b>mode:</b> {mode} | <b>loading:</b> {String(loading)}</div>
          <div><b>email length:</b> {email.length} | <b>password length:</b> {password.length}</div>
          <div><b>msg:</b> {msg || "(empty)"}</div>
          <div style={{ marginTop: 8, fontWeight: 800 }}>Trace (latest 20)</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, background: "#fff", padding: 8 }}>
{trace.length ? trace.join("\n") : "(no trace yet)"}
          </pre>
          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem("login_msg");
              window.localStorage.removeItem("login_trace");
              setMsg("");
              setTrace([]);
            }}
            style={{ marginTop: 8 }}
          >
            Clear debug
          </button>
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
