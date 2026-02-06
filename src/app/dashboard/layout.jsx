"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();

    // 1) Immediate check (but don't instantly bounce)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setReady(true);
    });

    // 2) Listen for auth state changes (this is the reliable bit)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
      else router.replace("/login");
    });

    // 3) Failsafe: if after 1s we still don't have a session, go login
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/login");
    }, 1000);

    return () => {
      sub?.subscription?.unsubscribe?.();
      clearTimeout(t);
    };
  }, [router]);

  if (!ready) return <main style={{ padding: 24 }}>Loading…</main>;

  return <>{children}</>;
}
