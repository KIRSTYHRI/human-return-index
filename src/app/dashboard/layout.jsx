"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Checking session…");

  useEffect(() => {
    let alive = true;
    const supabase = supabaseBrowser();

    // 1) Listen for auth changes (most reliable)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      if (session) {
        setStatus("Session found ✅");
        setReady(true);
      }
    });

    // 2) Also do an initial check (but don’t insta-bounce)
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;

      if (error) {
        setStatus("Session error (will redirect)…");
      } else if (data?.session) {
        setStatus("Session found ✅");
        setReady(true);
        return;
      } else {
        setStatus("No session yet… waiting 800ms");
        // wait a beat for storage/cookies to settle
        setTimeout(async () => {
          const again = await supabase.auth.getSession();
          if (!alive) return;

          if (again.data?.session) {
            setStatus("Session found after delay ✅");
            setReady(true);
          } else {
            setStatus("No session → redirecting to login");
            router.replace("/login");
          }
        }, 800);
      }
    })();

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  if (!ready) return <main style={{ padding: 24 }}>{status}</main>;

  return <>{children}</>;
}
