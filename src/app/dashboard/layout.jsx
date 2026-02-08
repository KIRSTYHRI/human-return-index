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
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid #1F2937",
        background: "#0B1020",
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
  const [trace, setTrace] = useState([]);

  useEffect(() => {
    let alive = true;
    const supabase = supabaseBrowser();

    const add = (m) =>
      setTrace((t) => [`${new Date().toISOString()} ${m}`, ...t].slice(0, 20));

    (async () => {
      add("dashboard layout mounted");
      const { data, error } = await supabase.auth.getSession();
      add(`getSession error=${!!error} hasSession=${!!data?.session}`);

      if (error || !data?.session) {
        add("no session -> redirect /login");
        router.replace("/login");
        return;
      }

      add("session ok -> ready");
      if (alive) setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <main style={{ padding: 24, color: "#E5E7EB" }}>
        Loading…
        <div style={{ marginTop: 12, opacity: 0.9 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Trace</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
            {trace.join("\n")}
          </pre>
        </div>
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
            <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>
              Human Return Index™
            </div>
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
