import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { ok: false, error: "Missing env vars", need: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
        { status: 500 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ ok: false, error: "Auth required (no bearer token)." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return NextResponse.json({ ok: false, error: userError?.message || "Invalid session" }, { status: 401 });
    }

    const user = userData.user;

    // Change table name if needed
    const { data: orgRow, error: orgError } = await supabase
      .from("user_organisations")
      .select("organisation_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgError) return NextResponse.json({ ok: false, error: orgError.message }, { status: 500 });
    if (!orgRow?.organisation_id) {
      return NextResponse.json({ ok: false, error: "No organisation linked to this user." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user_id: user.id, organisation_id: orgRow.organisation_id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
