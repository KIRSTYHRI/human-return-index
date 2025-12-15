import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Do NOT throw here — avoid build-time crashes
  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/hri-assessments
// Returns assessments (optionally filter by org_id)
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

    let q = supabase
      .from("hri_assessments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (org_id) q = q.eq("org_id", org_id);

    const { data, error } = await q;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/hri-assessments
// Creates a new assessment row
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

    const payload = {
      title,
      org_id,
      pillar_scores: body?.pillar_scores || {},
      overall_score: body?.overall_score ?? null,
      created_by: body?.created_by || null,
    };

    const { data, error } = await supabase
      .from("hri_assessments")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
