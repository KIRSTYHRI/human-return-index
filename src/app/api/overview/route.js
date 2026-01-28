import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const supabase = supabaseServer();

    // ✅ Allow curl/testing by passing organisation_id in the URL query
    const url = new URL(req.url);
    const orgFromQuery =
      url.searchParams.get("organisation_id") ||
      url.searchParams.get("organization_id") ||
      null;

    let organisation_id = orgFromQuery;

    // ✅ If org not provided, fall back to auth session (browser)
    if (!organisation_id) {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        return NextResponse.json(
          { ok: false, error: "Auth session missing!" },
          { status: 401 }
        );
      }

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

      organisation_id = orgRow.organisation_id;
    }

    // ✅ Your real table is hri_assessments and org column is org_id
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

    // If no assessment yet, return empty overview
    if (!assessment?.id) {
      return NextResponse.json({
        ok: true,
        overview: {
          organisation_id,
          assessment_id: null,
          title: null,
          period_start: "",
          period_end: "",
          status: "draft",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id,
        assessment_id: assessment.id,
        title: assessment.title || "Assessment",
        period_start: "",
        period_end: "",
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
