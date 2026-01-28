import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeScores(pillar_scores) {
  // pillar_scores could be {} or null or already an object
  const obj = pillar_scores && typeof pillar_scores === "object" ? pillar_scores : {};
  return Object.entries(obj).map(([pillar, score]) => ({
    pillar,
    score: score == null ? null : Number(score),
  }));
}

export async function GET(req) {
  try {
    const supabase = supabaseServer();
    const url = new URL(req.url);
    const assessment_id = url.searchParams.get("assessment_id");

    if (!assessment_id) {
      return NextResponse.json(
        { ok: false, error: "Missing assessment_id" },
        { status: 400 }
      );
    }

    // Optional auth — works in dashboard with cookies.
    // If you want curl to work, don’t hard-fail here.
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const authedUser = !userErr && userData?.user;

    // Pull assessment
    const { data: row, error } = await supabase
      .from("hri_assessments")
      .select("id, org_id, overall_score, pillar_scores, created_at, title")
      .eq("id", assessment_id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!row?.id) {
      return NextResponse.json(
        { ok: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // If authed, enforce org match (prevents cross-org leakage)
    if (authedUser) {
      const { data: orgRow } = await supabase
        .from("organisation_users")
        .select("organisation_id")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (orgRow?.organisation_id && orgRow.organisation_id !== row.org_id) {
        return NextResponse.json(
          { ok: false, error: "Forbidden (org mismatch)" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      assessment: {
        id: row.id,
        org_id: row.org_id,
        title: row.title,
        overall_score: row.overall_score,
        created_at: row.created_at,
      },
      scores: normalizeScores(row.pillar_scores),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
