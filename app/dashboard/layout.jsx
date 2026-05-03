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
    let cancelled = false;
    const supabase = supabaseBrowser();

    async function check() {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !data?.session?.user) {
        setDebug("No valid session — redirecting to login");
        router.replace("/login");
        return;
      }

      const user = data.session.user;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, organisation_id")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (profileError || !profile) {
        setDebug("Profile not found — redirecting to login");
        router.replace("/login");
        return;
      }

      const role = String(profile.role || "").trim().toLowerCase();

      if (role !== "owner" && role !== "admin") {
        setDebug(`Role is ${role || "missing"} — redirecting to pulse`);
        router.replace("/pulse");
        return;
      }

      setDebug(`Role is ${role} — dashboard allowed`);
      setReady(true);
    }

    check();

    return () => {
      cancelled = true;
    };
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
