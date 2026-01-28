import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function isUuid(v) {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function GET(req) {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const orgId =
      searchParams.get("org_id") ||
      searchParams.get("organisation_id") ||
      searchParams.get("organization_id");

    if (!isUuid(orgId)) {
      return NextResponse.json(
        { ok: false, error: "Missing/invalid organisation_id in query string" },
        { status: 400 }
      );
    }

    // latest assessment for org
    const { data: latest, error: latestErr } = await supabase
      .from("hri_assessments")
      .select("id, title, period_start, period_end, status, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestErr) {
      return NextResponse.json({ ok: false, error: latestErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id: orgId,
        assessment_id: latest?.id || null,
        title: latest?.title || null,
        period_start: latest?.period_start || null,
        period_end: latest?.period_end || null,
        status: latest?.status || null,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
