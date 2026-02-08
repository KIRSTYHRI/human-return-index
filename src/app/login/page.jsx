cat > src/app/dashboard/layout.jsx <<'EOF'
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

function NavBtn({ href, label }) {
  return (
    <Link
      href={href}
      style={{
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid #1F2937",
        background: "#0B1220",
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
  const [debug, setDebug] = useState("Checking session…");

  useEffect(() => {
    let alive = true;
    const supabase = supabaseBrowser();

    async function check() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          if (!alive) return;
          setDebug("Session error: " + error.message);
          router.replace("/login");
          return;
        }

        const session = data?.session;
        if (!session) {
          if (!alive) return;
          setDebug("No session found → redirecting to /login");
          router.replace("/login");
          return;
        }

        if (!alive) return;
        setDebug("Session OK ✅");
        setReady(true);
      } catch (e) {
        if (!alive) return;
        setDebug("Session check crashed: " + (e?.message || "unknown error"));
        router.replace("/login");
      }
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  if (!ready) {
    return (
      <main
        style={{
          padding: 24,
          color: "#E5E7EB",
          background: "#0B0F19",
          minHeight: "100vh",
        }}
      >
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Loading dashboard…</div>
        <div style={{ fontSize: 13, color: "#9CA3AF" }}>{debug}</div>
      </main>
    );
  }

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
            <div style={{ fontSize: 12, color: "#9CA3AF" }}>Dashboard</div>
          </div>

          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <NavBtn href="/dashboard" label="Overview" />
            <NavBtn href="/dashboard/hri-assessment" label="HRI Assessment" />
            <NavBtn href="/dashboard/employee-pulse" label="Employee Pulse" />
            <NavBtn href="/dashboard/scores" label="Scores" />
            <NavBtn href="/dashboard/settings" label="Settings" />
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
EOF
