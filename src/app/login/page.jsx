"use client";

import { useState } from "react";
import { supabaseBrowser } from "../../lib/supabaseBrowser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!supabaseBrowser) {
      setError("Supabase client not initialised. Check your env vars in Vercel.");
      return;
    }

    try {
      setSending(true);

      const { error: signInError } = await supabaseBrowser.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/dashboard`
              : undefined,
        },
      });

      if (signInError) {
        throw signInError;
      }

      setMessage(
        "Magic link sent. Check your email and click the link to access your HRI dashboard."
      );
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong sending the magic link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main
      style={{
        padding: 24,
        fontFamily: "system-ui",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        Log in to Human Return Index™
      </h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Enter your work email to receive a one-time magic link to your HRI
        dashboard.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#ffe6e6",
            color: "#7a0000",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#e6ffef",
            color: "#005c2e",
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #d0d0d0",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            padding: "8px 14px",
            borderRadius: 999,
            border: "none",
            background: "#000",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? "Sending…" : "Send link"}
        </button>
      </form>

      <p style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
        During pilot, you can still access your dashboard directly at{" "}
        <code>/dashboard</code> while we finish the full login experience.
      </p>
    </main>
  );
}
