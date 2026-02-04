import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "OVERVIEW_V4__CONSISTENT_RESPONSE_SHAPE";

function ok(payload, status = 200) {
  return NextResponse.json({ ok: true, version: VERSION, ...payload }, { status });
}

function fail(message, code = "UNKNOWN", status = 400, meta) {
  return NextResponse.json(
    { ok: false, version: VERSION, error: { message, code, ...(meta ? { meta } : {}) } },
    { status }
  );
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return fail("Auth session missing!", "AUTH", 401);

    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orgErr || !orgRow?.organisation_id) {
      return fail("No organisation linked to this user.", "NO_ORG", 400, {
        orgErr: orgErr?.message || null,
      });
    }

    const organisation_id = orgRow.organisation_id;

    const { data: assessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, title, created_at, overall_score, pillar_scores, org_id")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) return fail(aErr.message, "DB", 500);

    const overview = {
      organisation_id,
      assessment_id: assessment?.id || null,
      title: assessment?.title || null,
      overall_score: assessment?.overall_score ?? null,
      pillar_scores: assessment?.pillar_scores ?? {},
      created_at: assessment?.created_at || null,
      status: assessment?.id ? "draft" : null,
    };

    // Backwards compatible: `overview` stays top-level
    // Forward compatible: also available under `data.overview`
    return ok({ overview, data: { overview } });
  } catch (e) {
    return fail(e?.message || "Unexpected error", "EXCEPTION", 500);
  }
}
