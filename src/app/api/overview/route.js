import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const supabase = supabaseServer();

    // ✅ Allow either:
    // 1) Logged-in dashboard user (preferred)
    // 2) Public org query param for testing (fallback)
    const url = new URL(req.url);
    const orgFromQuery =
      url.searchParams.get("organisation_id") ||
      url.searchParams.get("organization_id") ||
      null;

    let organisation_id = null;

    // Try auth first
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const hasUser = !userErr && userData?.user;

    if (hasUser) {
      const { data: orgRow, error: orgErr } = await supabase
        .from("organisation_users")
        .select("organisation_id, role")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (orgErr) {
        return NextResponse.json({ ok: false, error: orgErr.message }, { status: 500 });
      }

      organisation_id = orgRow?.organisation_id || null;
    }

    // If no auth org, fallback to query param
    if (!organisation_id && orgFromQuery) organisation_id = orgFromQuery;

    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id (no session and no query param)" },
        { status: 400 }
      );
    }

    // ✅ IMPORTANT: query hri_assessments (NOT assessments)
    const { data: assessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, title, period_start, period_end, created_at")
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

    // You don’t have a status column on hri_assessments (based on your curl output),
    // so we return a sensible default:
    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id,
        assessment_id: assessment.id,
        title: assessment.title || "Assessment",
        period_start: assessment.period_start || "",
        period_end: assessment.period_end || "",
        status: "active",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const supabase = supabaseServer();

    // ✅ Allow either:
    // 1) Logged-in dashboard user (preferred)
    // 2) Public org query param for testing (fallback)
    const url = new URL(req.url);
    const orgFromQuery =
      url.searchParams.get("organisation_id") ||
      url.searchParams.get("organization_id") ||
      null;

    let organisation_id = null;

    // Try auth first
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const hasUser = !userErr && userData?.user;

    if (hasUser) {
      const { data: orgRow, error: orgErr } = await supabase
        .from("organisation_users")
        .select("organisation_id, role")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (orgErr) {
        return NextResponse.json({ ok: false, error: orgErr.message }, { status: 500 });
      }

      organisation_id = orgRow?.organisation_id || null;
    }

    // If no auth org, fallback to query param
    if (!organisation_id && orgFromQuery) organisation_id = orgFromQuery;

    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id (no session and no query param)" },
        { status: 400 }
      );
    }

    // ✅ IMPORTANT: query hri_assessments (NOT assessments)
    const { data: assessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, title, period_start, period_end, created_at")
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

    // You don’t have a status column on hri_assessments (based on your curl output),
    // so we return a sensible default:
    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id,
        assessment_id: assessment.id,
        title: assessment.title || "Assessment",
        period_start: assessment.period_start || "",
        period_end: assessment.period_end || "",
        status: "active",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
