import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// ✅ Your org id (fallback so nothing breaks)
const FALLBACK_ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, { auth: { persistSession: false } });
}

// GET /api/hri-assessments?org_id=...
export async function GET(req) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const org_id = searchParams.get("org_id") || FALLBACK_ORG_ID;

    const { data, error } = await supabase
      .from("hri_assessments")
      .select("*")
      .eq("org_id", org_id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ ok: true, data: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/hri-assessments
export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const org_id =
      body?.org_id ||
      body?.organisation_id ||
      body?.organization_id ||
      FALLBACK_ORG_ID;

    const payload = {
      title: body?.title || "HRI Assessment",
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

    if (error) throw error;

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
