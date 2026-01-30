import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "OVERVIEW_V4__DEBUG_HRI_ASSESSMENTS";

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orgErr || !orgRow?.organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No organisation linked to this user." },
        { status: 400 }
      );
    }

    const organisation_id = orgRow.organisation_id;

    // 1) Count how many rows exist for this org (if RLS blocks, you'll get 0 or an error)
    const { count, error: countErr } = await supabase
      .from("hri_assessments")
      .select("*", { count: "exact", head: true })
      .eq("org_id", organisation_id);

    // 2) Try fetch latest
    const { data: assessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, title, created_at, overall_score, pillar_scores, org_id")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      version: VERSION,
      debug: {
        user_id: userData.user.id,
        organisation_id,
        count,
        countErr: countErr ? countErr.message : null,
        aErr: aErr ? aErr.message : null,
        found: !!assessment?.id,
      },
      overview: {
        organisation_id,
        assessment_id: assessment?.id || null,
        title: assessment?.title || null,
        overall_score: assessment?.overall_score ?? null,
        pillar_scores: assessment?.pillar_scores ?? {},
        created_at: assessment?.created_at || null,
        status: assessment?.id ? "draft" : null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
