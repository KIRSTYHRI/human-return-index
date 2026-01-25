import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = supabaseServer();

    // 1) Who is logged in?
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    // 2) Find the user's organisation
    //    (this matches your /api/me/org output shape)
    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgErr) throw orgErr;

    const organisation_id = orgRow?.organisation_id;
    if (!organisation_id) {
      return NextResponse.json(
        { ok: true, overview: null, message: "No organisation linked to this user." },
        { status: 200 }
      );
    }

    // 3) Get latest assessment for this org
    //    NOTE: We keep this defensive because columns can vary.
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select("id, title, status, period_start, period_end, created_at")
      .eq("organisation_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) {
      // If table/columns differ, return null but don't crash the app
      return NextResponse.json(
        {
          ok: true,
          overview: null,
          organisation_id,
          message:
            "Could not read latest assessment (check assessments table/columns).",
          details: aErr.message,
        },
        { status: 200 }
      );
    }

    if (!assessment) {
      return NextResponse.json(
        { ok: true, overview: null, organisation_id, message: "No assessments found yet." },
        { status: 200 }
      );
    }

    // 4) Return in the exact shape CurrentAssessmentCard expects
    return NextResponse.json(
      {
        ok: true,
        overview: {
          organisation_id,
          assessment_id: assessment.id,
          title: assessment.title ?? "Untitled assessment",
          status: assessment.status ?? "unknown",
          period_start: assessment.period_start ?? null,
          period_end: assessment.period_end ?? null,
          created_at: assessment.created_at ?? null,
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
