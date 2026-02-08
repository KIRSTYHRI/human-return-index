import { NextResponse } from "next/server";
import { supabaseRouteClient } from "../../../lib/supabase/routeClient";

const VERSION = "overview-v1";

export async function GET() {
  try {
    const supabase = supabaseRouteClient();

    // Auth check (cookie-based)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    /**
     * IMPORTANT:
     * You have two options here:
     * A) If your overview is purely RLS-based, you can query tables directly and RLS will scope to user.
     * B) If you need organisation_id first, fetch it (common pattern).
     *
     * I'm doing (B) safely — adjust table/column names if yours differ.
     */

    // Example: fetch the user's org (adjust table name if needed)
    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_profiles")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (orgErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: orgErr.message },
        { status: 500 }
      );
    }

    const organisation_id = orgRow?.id || null;

    // If your app expects an org, fail clearly
    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No organisation found for this user." },
        { status: 404 }
      );
    }

    // ✅ Return something stable so your dashboard doesn't crash
    // Replace this with your real overview data queries.
    return NextResponse.json({
      ok: true,
      version: VERSION,
      user_id: user.id,
      organisation_id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
