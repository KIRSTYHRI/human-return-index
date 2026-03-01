cat > src/app/dashboard/CurrentAssessmentCard.jsx <<'EOF'
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "../../lib/supabase/client";

export default function CurrentAssessmentCard() {
  const [loading, setLoading] = useState(true);
  const [sessionOk, setSessionOk] = useState(false);
  const [error, setError] = useState("");
  const [latestPulse, setLatestPulse] = useState(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        const supabase = supabaseBrowser();

        // 1) Check session in the browser (this is what was missing)
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const session = data?.session;
        if (!session) {
          if (!alive) return;
          setSessionOk(false);
          setLoading(false);
          return;
        }

        if (!alive) return;
        setSessionOk(true);

        // 2) OPTIONAL: pull something simple to prove API works (no auth required here)
        // If your /api/pulse-latest is now guarded, this may 401 — that’s fine, we’ll handle it next.
        const orgId =
          new URLSearchParams(window.location.search).get("organisation_id") ||
          localStorage.getItem("hri_org_id") ||
          "";

        if (orgId) {
          const res = await fetch(`/api/pulse-latest?organisation_id=${orgId}`, {
            cache: "no-store",
          });

          const bodyText = await res.text();
          let body = null;
          try { body = JSON.parse(bodyText); } catch { body = { raw: bodyText }; }

          if (!res.ok) {
            // don’t kill the UI; just show what happened
            if (!alive) return;
            setLatestPulse({ ok: false, status: res.status, body });
          } else {
            if (!alive) return;
            setLatestPulse(body);
          }
        }

        if (!alive) return;
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Unexpected error");
        setLoading(false);
      }
    }

    run();
    return () => { alive = false; };
  }, []);

  return (
    <section style={{ border: "1px solid #1F2937", borderRadius: 16, padding: 16, background: "#070A12" }}>
      <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 6 }}>Current HRI Assessment</div>
      <div style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 12 }}>
        Live view of your latest internal assessment, powered by real responses and pillar scores.
      </div>

      {loading && <div style={{ color: "#9CA3AF" }}>Loading…</div>}

      {!loading && error && (
        <div style={{ color: "#FCA5A5", fontWeight: 700 }}>Error: {error}</div>
      )}

      {!loading && !error && !sessionOk && (
        <div style={{ color: "#FCA5A5", fontWeight: 800 }}>
          Auth session missing!
          <div style={{ color: "#9CA3AF", fontWeight: 400, marginTop: 6 }}>
            You’re logged in on the login page, but the session isn’t available here yet.
            (Next step: we’ll confirm cookies/storage + callback flow.)
          </div>
        </div>
      )}

      {!loading && !error && sessionOk && (
        <>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Session OK ✅</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/dashboard/hri-assessment" style={{ color: "#FDE047", fontWeight: 800, textDecoration: "none" }}>
              Continue assessment →
            </Link>
            <Link href="/dashboard/employee-pulse" style={{ color: "#FDE047", fontWeight: 800, textDecoration: "none" }}>
              View pulse →
            </Link>
          </div>

          {latestPulse && (
            <div style={{ marginTop: 12, padding: 10, borderRadius: 12, border: "1px solid #1F2937", background: "#0B1220" }}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>pulse-latest debug</div>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, margin: 0 }}>
                {JSON.stringify(latestPulse, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}
    </section>
  );
}
EOF
