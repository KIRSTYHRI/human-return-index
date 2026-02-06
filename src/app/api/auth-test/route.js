import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
  });

  // This doesn't sign in — it just tells us if server can talk to auth
  const { data, error } = await supabase.auth.getSession();

  return NextResponse.json({
    ok: !error,
    error: error?.message || null,
    sessionExists: !!data?.session,
  });
}
