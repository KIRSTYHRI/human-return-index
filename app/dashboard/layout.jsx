"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";
import LogoutButton from "../components/LogoutButton";

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

      const user = data?.session?.user;

      if (!user) {
        setDebug("No session");
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, organisation_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setDebug("Profile not found");
        router.replace("/login");
        return;
      }

      const isEmployer = profile.role === "owner" || profile.role === "admin";

      if (!isEmployer) {
        setDebug("Employee account - redirecting to pulse");
        router.replace("/pulse");
        return;
      }

      setDebug("Employer session OK");
      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) {
    return <div style={{ padding: 16 }}>Loading… {debug}</div>;
  }

  return (
    <>
      <LogoutButton />
      {children}
    </>
  );
}
