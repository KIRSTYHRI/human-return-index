import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 👇 TEMP FIX: hard fallback org id (replace with yours)
const FALLBACK_ORG_ID = "PASTE_YOUR_ORG_ID_HERE";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/* ============================
   GET – list assessments
============================ */
export async function GET(req) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const org_id =
      searchParams.get("org_id") ||
      FALLBACK_ORG_ID;

    const { data, error } = await supabase
      .from("hri_assessments")
      .select("*")
      .eq("org_id", org_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/* ============================
   POST – create assessment
============================ */
export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const org_id =
      body.org_id ||
      body.organization_id ||
      FALLBACK_ORG_ID;

    const payload = {
      title: body.title || "HRI Assessment",
      org_id,
      pillar_scores: body.pillar_scores || {},
      overall_score: body.overall_score ?? null,
      created_by: body.created_by ?? null,
    };

    const { data, error } = await supabase
      .from("hri_assessments")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
