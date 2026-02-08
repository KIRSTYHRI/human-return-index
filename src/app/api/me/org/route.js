import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getBearerToken(req) {
  const h = req.headers.get("authorization") || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export async function GET(req) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Auth required." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

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

    if (orgError) {
      return NextResponse.json({ ok: false, error: orgError.message }, { status: 500 });
    }

    if (!orgRow?.organisation_id) {
      return NextResponse.json({ ok: false, error: "No organisation linked to this user." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      user_id: user.id,
      organisation_id: orgRow.organisation_id,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
