"use client";

import LogoutButton from "@/app/components/LogoutButton";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [debug, setDebug] = useState("Checking session…");

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function check() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setDebug(`Session error: ${error.message}`);
        router.replace("/login");
        return;
      }

      if (!data?.session) {
        setDebug("No session");
        router.replace("/login");
        return;
      }

      setDebug("Session OK");
      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) return <div style={{ padding: 16 }}>Loading… {debug}</div>;

  return <>{children}</>;
}
