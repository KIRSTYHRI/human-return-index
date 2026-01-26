import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = supabaseServer();

    // must be logged in (works in browser; curl won't have cookies)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth session missing!" }, { status: 401 });
    }

    // org context
    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orgErr || !orgRow?.organisation_id) {
      return NextResponse.json(
        { ok: false, error: "No organisation linked to this user." },
        { status: 400 }
      );
    }

    const organisation_id = orgRow.organisation_id;

    // latest assessment for this org (adjust if your table name differs)
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select("id, title, period_start, period_end, status")
      .eq("organisation_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // No assessment yet = not an error, just return empty overview
    if (aErr) {
      return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
    }

    if (!assessment?.id) {
      return NextResponse.json({
        ok: true,
        overview: {
          organisation_id,
          assessment_id: null,
          title: null,
          period_start: null,
          period_end: null,
          status: null,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id,
        assessment_id: assessment.id,
        title: assessment.title || "Assessment",
        period_start: assessment.period_start || "",
        period_end: assessment.period_end || "",
        status: assessment.status || "draft",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
