import { NextResponse } from "next/server";
import { supabaseFromBearer } from "../../../../lib/supabase/bearerRouteClient";

const VERSION = "ME_ORG_V1";

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

    // ✅ TEMP: return user only (wire your org lookup back in next)
    return NextResponse.json({
      ok: true,
      version: VERSION,
      user_id: user.id,
      email: user.email,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
