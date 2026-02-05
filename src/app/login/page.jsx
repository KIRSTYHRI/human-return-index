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

  // Persist msg so it won't "disappear" if the page reloads
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

    alert("✅ SUBMIT FIRED"); // <-- cannot be missed

    setMsgPersist("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      if (!email) throw new Error("Please enter your email");

      // PASSWORD LOGIN
      if (mode === "password") {
        if (!password) throw new Error("Please enter your password");

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setMsgPersist(`Login failed: ${error.message}`);
          return;
        }

        setMsgPersist("Login OK ✅ Redirecting...");
        setTimeout(() => window.location.assign("/dashboard"), 800);
        return;
      }

      // MAGIC LINK
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
      setMsgPersist(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <section style={{ width: "100%", maxWidth: 520 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Log in</h1>

        {/* DEBUG BOX */}
        <div style={{ padding: 10, background: "#fff6bf", border: "1px solid #000", marginBottom: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Debug (remove later)</div>
          <div><b>URL:</b> {supabaseUrl || "❌ missing"}</div>
          <div><b>ANON starts:</b> {anonKey ? anonKey.slice(0, 12) + "…" : "❌ missing"}</div>
          <div style={{ marginTop: 8 }}><b>mode:</b> {mode} | <b>loading:</b> {String(loading)}</div>
          <div><b>email length:</b> {email.length} | <b>password length:</b> {password.length}</div>
          <div><b>msg:</b> {msg || "(empty)"}</div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button type="button" onClick={() => setMode("password")} style={{ flex: 1 }}>
            Password
          </button>
          <button type="button" onClick={() => setMode("magic")} style={{ flex: 1 }}>
            Magic link
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onSubmitCapture={() => setMsgPersist("🟡 submit captured")}
          style={{ display: "grid", gap: 10 }}
        >
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" />

          {mode === "password" && (
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
          )}

          <button
            type="submit"
            disabled={loading}
            onClick={() => setMsgPersist("🟢 button clicked")}
          >
            {loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}
          </button>
        </form>
      </section>
    </main>
  );
}
