"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

function getStoredTokens() {
  try {
    const raw = localStorage.getItem("hri-sb-auth");
    if (!raw) return null;
    const obj = JSON.parse(raw);
    const access_token = obj?.access_token;
    const refresh_token = obj?.refresh_token;
    if (!access_token || !refresh_token) return null;
    return { access_token, refresh_token };
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [debug, setDebug] = useState("Checking session…");

  useEffect(() => {
    const supabase = supabaseBrowser();
    let alive = true;

    (async () => {
      try {
        setDebug("getSession()…");
        const { data, error } = await supabase.auth.getSession();
        if (!alive) return;

        if (error) {
          setDebug(`getSession error: ${error.message}`);
          router.replace("/login");
          return;
        }

        if (data?.session) {
          setDebug("Session OK ✅");
          setReady(true);
          return;
        }

        // ✅ No session? Hydrate from localStorage
        setDebug("No session. Trying localStorage hydrate…");
        const tokens = getStoredTokens();

        if (!tokens) {
          setDebug("No tokens in localStorage → /login");
          router.replace("/login");
          return;
        }

        const setRes = await supabase.auth.setSession(tokens);
        if (!alive) return;

        if (setRes?.error) {
          setDebug(`setSession failed: ${setRes.error.message} → /login`);
          router.replace("/login");
          return;
        }

        const { data: data2 } = await supabase.auth.getSession();
        if (!alive) return;

        if (data2?.session) {
          setDebug("Hydrated ✅");
          setReady(true);
          return;
        }

        setDebug("Still no session → /login");
        router.replace("/login");
      } catch (e) {
        setDebug(`Exception: ${String(e?.message || e)} → /login`);
        router.replace("/login");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (!ready) return <div style={{ padding: 16 }}>Loading… {debug}</div>;

  return <>{children}</>;
}
