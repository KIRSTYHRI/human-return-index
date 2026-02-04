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

    console.log("ENV CHECK:", {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const supabase = supabaseBrowser();
      console.log("SUPABASE OK");

      if (!supabase) {
        throw new Error("Supabase client not initialised (check env keys)");
      }

      if (!email) {
        throw new Error("Please enter your email");
      }

      // =========================
      // PASSWORD LOGIN
      // =========================
      if (mode === "password") {
        if (!password) {
          throw new Error("Please enter your password");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("LOGIN RESULT:", { data, error });

        if (error) {
          setMsg(`Login failed: ${error.message}`);
          return;
        }

        // Check session exists
        const { data: sessionData } = await supabase.auth.getSession();

        console.log("SESSION AFTER LOGIN:", sessionData);

        if (!sessionData?.session) {
          setMsg("Login worked but session not created. Check cookies/auth config.");
          return;
        }

        // Redirect after success
        window.location.assign("/dashboard");
        return;
      }

      // =========================
      // MAGIC LINK LOGIN
      // =========================
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      console.log("MAGIC LINK RESULT:", { data, error });

      if (error) {
        setMsg(`Magic link failed: ${error.message}`);
        return;
      }

      setMsg("Magic link sent. Check your inbox (and spam).");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

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

        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setMode("password")}
            style={{
              flex: 1,
              background: mode === "password" ? "#000" : "#eee",
              color: mode === "password" ? "#fff" : "#000",
              padding: 8,
            }}
          >
            Password
          </button>

          <button
            type="button"
            onClick={() => setMode("magic")}
            style={{
              flex: 1,
              background: mode === "magic" ? "#000" : "#eee",
              color: mode === "magic" ? "#fff" : "#000",
              padding: 8,
            }}
          >
            Magic link
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 10 }}
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
            required
          />

          {mode === "password" && (
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="••••••••"
              required
            />
          )}

          <button disabled={loading}>
            {loading
              ? "Working…"
              : mode === "password"
              ? "Log in"
              : "Send magic link"}
          </button>

          {msg && (
            <p
              style={{
                marginTop: 6,
                fontSize: 14,
                color: msg.includes("failed") ? "red" : "green",
              }}
            >
              {msg}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
