"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../lib/supabase/client"; // adjust if path differs
import CurrentAssessmentCard from "./CurrentAssessmentCard";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getSession();
      if (!data?.session) router.replace("/login");
    })();
  }, [router]);

  return (
    <main style={{ padding: 24 }}>
      <CurrentAssessmentCard />
    </main>
  );
}
