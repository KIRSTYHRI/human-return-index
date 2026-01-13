import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ORG_ID_FALLBACK = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const organisation_id = searchParams.get("organisation_id") || ORG_ID_FALLBACK;

    const { data, error } = await supabase
      .from("hri_scores")
      .select(
        "id, employer_score, employee_score, hri_score, employer_pillar_1, employer_pillar_2, employer_pillar_3, employer_pillar_4, employer_pillar_5, employee_pillar_1, employee_pillar_2, employee_pillar_3, employee_pillar_4, employee_pillar_5, badge, updated_at"
      )
      .eq("organisation_id", organisation_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    // Notice: we do NOT return organisation_id now
    return NextResponse.json({ ok: true, data: data || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
