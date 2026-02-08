"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

function NavBtn({ href, label }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #1F2937",
        background: active ? "#111827" : "#070A12",
        color: "#E5E7EB",
        textDecoration: "none",
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
    </Link>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let alive = true;
    const supabase = supabaseBrowser();

    async function boot() {
      // 1) check session
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      // 2) (optional) show who is logged in
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email || "";
      if (alive) setEmail(userEmail);

      if (alive) setReady(true);
    }

    // keep session in sync (important)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    boot();

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  if (!ready) return <main style={{ padding: 24 }}>Loading…</main>;

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#E5E7EB" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 16px 28px" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 14px",
            border: "1px solid #1F2937",
            borderRadius: 16,
            background: "#070A12",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>Human Return Index™</div>
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>
              Dashboard {email ? `• ${email}` : ""}
            </div>
          </div>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NavBtn href="/dashboard" label="Overview" />
            <NavBtn href="/dashboard/hri-assessment" label="HRI Assessment" />
            <NavBtn href="/dashboard/employee-pulse" label="Employee Pulse" />
            <NavBtn href="/dashboard/scores" label="Scores" />
            <NavBtn href="/dashboard/settings" label="Settings" />
            <button
              onClick={async () => {
                const supabase = supabaseBrowser();
                await supabase.auth.signOut();
                router.replace("/login");
              }}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #1F2937",
                background: "#070A12",
                color: "#E5E7EB",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
