import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VERSION = "OVERVIEW_V3__HRI_ASSESSMENTS__ORG_ID__NO_PERIOD_FIELDS";

export async function GET(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json({ ok: false, version: VERSION, error: "Missing token" }, { status: 401 });
    }

  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json({ ok: false, version: VERSION, error: "Auth session missing!" }, { status: 401 });
  }

  // ✅ now run your existing overview logic here using `supabase`
  return NextResponse.json({ ok: true, version: VERSION, user_id: userData.user.id });
}
