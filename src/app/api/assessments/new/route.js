import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // IMPORTANT: never throw here (prevents build crashes)
  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

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
