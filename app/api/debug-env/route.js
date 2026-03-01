import { NextResponse } from "next/server";

export async function GET() {
  const val = process.env.HRI_DEMO_ORG_ID || "";
  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: { exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL, preview: (process.env.NEXT_PUBLIC_SUPABASE_URL || "").slice(0, 8) + "…" },
    supabaseAnon: { exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, preview: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 8) + "…" },
    serviceRole: { exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY, preview: (process.env.SUPABASE_SERVICE_ROLE_KEY || "").slice(0, 8) + "…" },
    demoOrg: { exists: !!val, value: val || null },
  });
}
