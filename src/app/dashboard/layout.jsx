cat > app/dashboard/layout.jsx <<'EOF'
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabase/browser";

export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function check() {
      const { data } = await supabase.auth.getSession();

      if (!data?.session) {
        router.replace("/login");
        return;
      }

      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) return <div>Loading…</div>;

  return <>{children}</>;
}
EOF
