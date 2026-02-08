import { NextResponse } from "next/server";
import { supabaseFromBearer } from "../../../lib/supabase/bearerRouteClient";

const VERSION = "OVERVIEW_V3__HRI_ASSESSMENTS__ORG_ID__NO_PERIOD_FIELDS";

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
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    // ✅ TEMP return (so we can test auth works end-to-end)
    // Now paste your existing overview logic underneath using `supabase`.
    return NextResponse.json({
      ok: true,
      version: VERSION,
      user_id: userData.user.id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
