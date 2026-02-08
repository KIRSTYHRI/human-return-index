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

export async function POST(req) {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    // Accept any of these names (because your project mixes naming)
    const orgId =
      body.org_id ||
      body.organisation_id ||
      body.organization_id ||
      body.organisationId ||
      body.organizationId;

    if (!isUuid(orgId)) {
      return NextResponse.json(
        { ok: false, error: "Missing/invalid org id. Send org_id (uuid) or organisation_id (uuid) in body." },
        { status: 400 }
      );
    }

    const title = (body.title || "Pilot Baseline Assessment").toString().slice(0, 200);
    const period_start = body.period_start || null; // "YYYY-MM-DD"
    const period_end = body.period_end || null;     // "YYYY-MM-DD"
    const status = body.status || "active";

    const { data, error } = await supabase
      .from("hri_assessments")
      .insert([
        {
          org_id: orgId,
          title,
          period_start,
          period_end,
          status,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assessment: data }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
