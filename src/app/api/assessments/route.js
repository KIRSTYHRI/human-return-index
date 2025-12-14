import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Never throw here (prevents build-time crashes)
  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/assessments
// Returns latest assessments for an org (optional org_id query param)
export async function GET(request) {
  const supabase = getServiceSupabase();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing server env vars" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const org_id = searchParams.get("org_id");

    let query = supabase
      .from("hri_assessments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (org_id) query = query.eq("org_id", org_id);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assessments: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/assessments
// Creates an assessment (basic support)
export async function POST(request) {
  const supabase = getServiceSupabase();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing server env vars" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const title = body?.title || "HRI Assessment";
    const org_id = body?.org_id || body?.organisation_id || null;

    const { data, error } = await supabase
      .from("hri_assessments")
      .insert({
        title,
        org_id,
        pillar_scores: body?.pillar_scores || {},
        overall_score: body?.overall_score ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, assessment: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
