"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../lib/supabase/client"; // <-- if this path errors, see note below

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const supabase = supabaseBrowser();

        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) {
          router.replace("/login");
          return;
        }

        if (alive) setReady(true);
      } catch (e) {
        router.replace("/login");
      }
    }

    run();

    return () => {
      alive = false;
    };
  }, [router]);

  if (!ready) return <main style={{ padding: 24 }}>Loading…</main>;

  return <>{children}</>;
}
