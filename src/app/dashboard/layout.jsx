cat > src/app/dashboard/layout.jsx <<'EOF'
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/client";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [debug, setDebug] = useState("Checking session…");

  useEffect(() => {
    const supabase = supabaseBrowser();

    let cancelled = false;

    async function check() {
      const { data, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error) {
        setDebug("Session error → login");
        router.replace("/login");
        return;
      }

      if (!data?.session) {
        setDebug("No session → login");
        router.replace("/login");
        return;
      }

      setDebug("Session OK ✅");
      setReady(true);
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) return <div style={{ padding: 16 }}>Loading… {debug}</div>;

  return <>{children}</>;
}
EOF
