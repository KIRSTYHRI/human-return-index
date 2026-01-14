"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password"); // "password" | "magic"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      if (!email) throw new Error("Enter your email");

      if (mode === "password") {
        if (!password) throw new Error("Enter your password");

        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Hard redirect helps break auth loops in some setups
        window.location.href = "/dashboard";
        return;
      }

      // Magic link mode
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Keep this, but make sure this URL is allowed in Supabase Auth Redirect URLs
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;

      setMsg("Magic link sent. Check your inbox (and spam).");
    } catch (err) {
      setMsg(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#E5E7EB",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          border: "1px solid #1F2937",
          borderRadius: 14,
          padding: 18,
          background: "#030712",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
          Log in
        </h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 14 }}>
          Pilot access only.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setMode("password")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #1F2937",
              background: mode === "password" ? "#FEE000" : "#0B1220",
              color: mode === "password" ? "#111827" : "#E5E7EB",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("magic")}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #1F2937",
              background: mode === "magic" ? "#FEE000" : "#0B1220",
              color: mode === "magic" ? "#111827" : "#E5E7EB",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Magic link
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <label style={{ fontSize: 12, color: "#9CA3AF" }}>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@company.com"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #1F2937",
                background: "#0B1220",
                color: "#E5E7EB",
              }}
            />
          </label>

          {mode === "password" && (
            <label style={{ fontSize: 12, color: "#9CA3AF" }}>
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #1F2937",
                  background: "#0B1220",
                  color: "#E5E7EB",
                }}
              />
            </label>
          )}

          <button
            disabled={loading}
            style={{
              marginTop: 6,
              width: "100%",
              background: "#FEE000",
              color: "#111827",
              border: "1px solid #EAB308",
              borderRadius: 12,
              padding: "12px 14px",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Working…" : mode === "password" ? "Log in" : "Send magic link"}
          </button>

          {msg && (
            <p
              style={{
                marginTop: 8,
                fontSize: 13,
                color: msg.includes("sent") ? "#A7F3D0" : "#FCA5A5",
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
