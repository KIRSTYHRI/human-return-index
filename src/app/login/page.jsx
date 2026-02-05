"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log("🚀 SUBMIT CLICKED");

    setMsg("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();

      if (!email) {
        throw new Error("Please enter your email");
      }

      // ----------------------
      // PASSWORD LOGIN
      // ----------------------
      if (mode === "password") {
        if (!password) {
          throw new Error("Please enter your password");
        }

        console.log("🔐 Trying password login...");

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("LOGIN RESPONSE:", data, error);

        if (error) throw error;

        setMsg("Login OK ✅ Redirecting...");
        console.log("✅ LOGIN SUCCESS");

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);

        return;
      }

      // ----------------------
      // MAGIC LINK
      // ----------------------
      console.log("📩 Sending magic link...");

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      setMsg("Magic link sent. Check your inbox 📩");
    } catch (err) {
      console.error("❌ LOGIN ERROR:", err);
      setMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------
  // ENV DEBUG
  // ----------------------
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
          Log in
        </h1>

        {/* ---------------- DEBUG BOX ---------------- */}
        <div
          style={{
            fontSize: 12,
            background: "#f3f3f3",
            padding: 10,
            marginBottom: 15,
            borderRadius: 6,
          }}
        >
          <strong>Debug (remove later)</strong>
          <br />
          URL: {supabaseUrl || "❌ missing"}
          <br />
          ANON starts: {anonKey ? anonKey.slice(0, 12) + "…" : "❌ missing"}
          <br />
          mode: {mode} | loading: {String(loading)}
          <br />
          email length: {email.length} | password length: {password.length}
          <br />
          msg: {msg || "(empty)"}
        </div>

        {/* ---------------- MODE BUTTONS ---------------- */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setMode("password")}
            style={{ flex: 1 }}
          >
            Password
          </button>

          <button
            type="button"
            onClick={() => setMode("magic")}
            style={{ flex: 1 }}
          >
            Magic link
          </button>
        </div>

        {/* ---------------- FORM ---------------- */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSubmit(e);
          }}
          style={{ display: "grid", gap: 10 }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
          />

          {mode === "password" && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
            />
          )}

          <button type="submit" disabled={loading}>
            {loading
              ? "Working…"
              : mode === "password"
              ? "Log in"
              : "Send magic link"}
          </button>

          {/* ---------------- MESSAGE ---------------- */}
          {msg && (
            <p style={{ fontSize: 14, marginTop: 6 }}>
              {msg}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
