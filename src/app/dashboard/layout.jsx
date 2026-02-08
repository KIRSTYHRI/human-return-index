"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function DashboardPage() {
  const [out, setOut] = useState("Loading…");

  useEffect(() => {
    async function run() {
      try {
        const supabase = supabaseBrowser();

        const { data: sessionData, error: sessErr } =
          await supabase.auth.getSession();

        if (sessErr) {
          setOut("Session error: " + sessErr.message);
          return;
        }

        if (!sessionData?.session) {
          setOut("❌ No session found in browser");
          return;
        }

        const token = sessionData.session.access_token;

        const res = await fetch("/api/me/org", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const text = await res.text();

        setOut(
          `Session: OK ✅\n\nAPI status: ${res.status}\n\nResponse:\n${text}`
        );
      } catch (e) {
        setOut("Crash: " + e.message);
      }
    }

    run();
  }, []);

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard Auth Test</h1>

      <pre
        style={{
          whiteSpace: "pre-wrap",
          background: "#111",
          color: "#0f0",
          padding: 16,
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        {out}
      </pre>
    </main>
  );
}
