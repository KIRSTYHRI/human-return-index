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
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });

  try {
    const { searchParams } = new URL(req.url);
    const organisation_id =
      searchParams.get("organisation_id") ||
      searchParams.get("organization_id") ||
      ORG_ID_FALLBACK;

    const { data, error } = await supabase
      .from("pulse_check_submissions")
      .select(
        "id, total_score, average_score, pillar_1_score, pillar_2_score, pillar_3_score, pillar_4_score, pillar_5_score, submitted_at"
      )
      .eq("organization_id", String(organisation_id))
      .not("average_score", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1);

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, data: data?.[0] || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
