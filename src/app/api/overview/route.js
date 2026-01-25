import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserOrg(supabase, userId) {
  // Matches what your /api/me/org is returning
  const { data, error } = await supabase
    .from("organisation_users")
    .select("organisation_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function getLatestAssessment(supabase, organisation_id) {
  // Try hri_assessments first (common in your build)
  const tryHri = await supabase
    .from("hri_assessments")
    .select("id, title, status, period_start, period_end, created_at")
    .eq("organisation_id", organisation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!tryHri.error && tryHri.data) return { source: "hri_assessments", row: tryHri.data };

  // Fallback: assessments
  const tryAssessments = await supabase
    .from("assessments")
    .select("id, title, status, period_start, period_end, created_at")
    .eq("organisation_id", organisation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (tryAssessments.error) {
    // Don’t crash the UI – return null + message
    return { source: "none", row: null, error: tryAssessments.error.message };
  }

  return { source: "assessments", row: tryAssessments.data || null };
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    // 1) Auth
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    // 2) Org
    const orgRow = await getUserOrg(supabase, user.id);
    const organisation_id = orgRow?.organisation_id || null;

    if (!organisation_id) {
      return NextResponse.json(
        { ok: true, overview: null, message: "No organisation linked to this user." },
        { status: 200 }
      );
    }

    // 3) Latest assessment
    const latest = await getLatestAssessment(supabase, organisation_id);

    if (!latest.row) {
      return NextResponse.json(
        {
          ok: true,
          overview: null,
          organisation_id,
          message: latest?.error
            ? `Could not read latest assessment: ${latest.error}`
            : "No assessments found yet.",
        },
        { status: 200 }
      );
    }

    // 4) Exact shape CurrentAssessmentCard expects
    const a = latest.row;

    return NextResponse.json(
      {
        ok: true,
        overview: {
          organisation_id,
          assessment_id: a.id,
          title: a.title ?? "Untitled assessment",
          status: a.status ?? "unknown",
          period_start: a.period_start ?? null,
          period_end: a.period_end ?? null,
          created_at: a.created_at ?? null,
          source: latest.source,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
