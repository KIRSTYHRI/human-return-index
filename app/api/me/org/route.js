import { NextResponse } from "next/server";
import { supabaseFromBearer } from "../../../../lib/supabase/bearerRouteClient";

const VERSION = "ME_ORG_V2";

export async function GET(req) {
  try {
    const { supabase } = supabaseFromBearer(req);

    if (!supabase) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Missing Bearer token" },
        { status: 401 }
      );
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    // ✅ Minimal org lookup (won't break if org tables differ)
    // Adjust table names if needed.
    const { data: membership, error: mErr } = await supabase
      .from("organisation_members")
      .select("organisation_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (mErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: `Org lookup failed: ${mErr.message}` },
        { status: 500 }
      );
    }

    const organisation_id = membership?.organisation_id || null;

    return NextResponse.json({
      ok: true,
      version: VERSION,
      user_id: user.id,
      email: user.email,
      organisation_id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
