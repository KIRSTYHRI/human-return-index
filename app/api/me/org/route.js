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

    // ✅ Try organisation_users first
    let organisation_id = null;

    const try1 = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (try1.data?.organisation_id) organisation_id = try1.data.organisation_id;

    // ✅ Fallback: organisation_members
    if (!organisation_id) {
      const try2 = await supabase
        .from("organisation_members")
        .select("organisation_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (try2.data?.organisation_id) organisation_id = try2.data.organisation_id;
    }

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
