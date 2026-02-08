import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function supabaseFromBearer(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;

  const supabase = createClient(url, anon, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });

  return { supabase, token };
}

export async function GET(req) {
  try {
    const { supabase, token } = supabaseFromBearer(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing Bearer token." }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth required." }, { status: 401 });
    }

    const user = userData.user;

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
