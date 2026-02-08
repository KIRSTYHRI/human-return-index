"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [trace, setTrace] = useState([]);

  function addTrace(line) {
    setTrace((t) => [line, ...t].slice(0, 30));
    console.log("[LOGIN TRACE]", line);
  }

  const envDebug = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonStart: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 12),
  };

  function supaStorageKeys() {
    const keys = Object.keys(localStorage || {});
    return keys.filter((k) => k.includes("hri-sb-auth") || k.includes("sb-"));
  }

  async function dumpAuth(label = "dump") {
    try {
      addTrace(`[${label}] localStorage supabase keys = ${JSON.stringify(supaStorageKeys())}`);

      const { data, error } = await supabase.auth.getSession();
      addTrace(`[${label}] getSession error = ${error ? error.message : "none"}`);
      addTrace(`[${label}] getSession hasSession = ${!!data?.session}`);

      if (data?.session) {
        addTrace(`[${label}] user = ${data.session.user?.id || "unknown"}`);
      }
    } catch (e) {
      addTrace(`[${label}] dumpAuth exception = ${String(e?.message || e)}`);
    }
  }

  useEffect(() => {
    // On load, show current state (proves persistence)
    dumpAuth("onload");

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      addTrace(`onAuthStateChange: ${event} | hasSession=${!!session}`);
    });

    return () => sub?.subscription?.unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    setTrace([]);

    try {
      addTrace("Submit fired");

      if (!email) throw new Error("Enter your email");
      if (!pa
