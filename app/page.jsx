"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../lib/supabase/browser";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const { data } = await supabase.auth.getSession();
      router.replace(data?.session ? "/dashboard" : "/login");
    })();
  }, [router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div>Loading…</div>
    </main>
  );
}
// deploy bump Mon  9 Feb 2026 22:22:11 GMT
