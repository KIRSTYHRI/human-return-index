import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const supabase = supabaseServer();

    // Allow curl usage via query param (for testing), while still supporting logged-in dashboard usage.
    const url = new URL(req.url);
    const qpOrg =
      url.searchParams.get("organisation_id") ||
      url.searchParams.get("organization_id") ||
      null;

    // Try auth session first (dashboard usage)
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user || null;

    let organisation_id = qpOrg;

    // If no org in querystring, fall back to user->organisation_users lookup
    if (!organisation_id) {
      if (!user) {
        return NextResponse.json(
          { ok: false, error: "Auth session missing!" },
          { status: 401 }
        );
      }

      const { data: orgRow, error: orgErr } = await supabase
        .from("organisation_users")
        .select("organisation_id, role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (orgErr || !orgRow?.organisation_id) {
        return NextResponse.json(
          { ok: false, error: "No organisation linked to this user." },
          { status: 400 }
        );
      }

      organisation_id = orgRow.organisation_id;
    }

    // IMPORTANT: Your assessments are stored in hri_assessments (org_id), not assessments (organisation_id)
    const { data: assessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, title, created_at")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

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

    // Your hri_assessments table (based on your curl output) doesn't have period_start/end/status,
    // so we return what exists and set the others to null.
    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id,
        assessment_id: assessment.id,
        title: assessment.title || "Assessment",
        period_start: null,
        period_end: null,
        status: "draft",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
