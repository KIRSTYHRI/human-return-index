import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ✅ change this string and you will SEE it in the browser immediately
const VERSION = "OVERVIEW_V3__HRI_ASSESSMENTS__ORG_ID__NO_PERIOD_FIELDS";

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

    const { data: assessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, title, created_at, overall_score, pillar_scores, org_id")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: aErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
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
