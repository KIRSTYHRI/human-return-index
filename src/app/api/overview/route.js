import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

// TEMP: use your seeded org (move to auth later)
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  // 1) Latest assessment for your org
  const { data: latestAssess, error: aErr } = await supabase
    .from("assessments")
    .select("id,title,status,created_at,period_start,period_end")
    .eq("organisation_id", ORG_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (aErr) {
    return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
  }
  if (!latestAssess) {
    return NextResponse.json({ ok: true, overview: null, scores: [] });
  }

  // 2) Pillar scores for that assessment
  const { data: scores, error: sErr } = await supabase
    .from("scores")
    .select("pillar,score")
    .eq("assessment_id", latestAssess.id)
    .order("pillar", { ascending: true });

  if (sErr) {
    return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });
  }

  // 3) Latest badge for the org (comes from badges table, not assessments)
  const { data: badge, error: bErr } = await supabase
    .from("badges")
    .select("level,awarded_at")
    .eq("organisation_id", ORG_ID)
    .order("awarded_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (bErr) {
    return NextResponse.json({ ok: false, error: bErr.message }, { status: 500 });
  }

  const overview = {
    assessment_id: latestAssess.id,
    title: latestAssess.title,
    status: latestAssess.status,
    assessment_created_at: latestAssess.created_at,
    period_start: latestAssess.period_start,
    period_end: latestAssess.period_end,
    badge_level: badge?.level ?? null,
    badge_awarded_at: badge?.awarded_at ?? null,
  };

  return NextResponse.json({ ok: true, overview, scores });
}
