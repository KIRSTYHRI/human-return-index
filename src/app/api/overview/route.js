import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn("Missing Supabase env vars in /api/overview");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Your organisation
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  try {
    // 1) Latest assessment for this org
    const { data: latestAssess, error: aErr } = await supabase
      .from("assessments")
      .select("id,title,status,created_at,period_start,period_end")
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) throw aErr;
    if (!latestAssess) {
      return NextResponse.json({ ok: true, overview: null, scores: [] });
    }

    // 2) Scores for that assessment
    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar,score")
      .eq("assessment_id", latestAssess.id)
      .order("pillar", { ascending: true });

    if (sErr) throw sErr;

    // 3) Latest badge for this org
    const { data: badge, error: bErr } = await supabase
      .from("badges")
      .select("level,awarded_at")
      .eq("organisation_id", ORG_ID)
      .order("awarded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (bErr) throw bErr;

    const overview = {
      assessment_id: latestAssess.id,
      title: latestAssess.title,
      status: latestAssess.status,
      assessment_created_at: latestAssess.created_at,
      period_start: latestAssess.period_start,
      period_end: latestAssess.period_end,
      // These are just JSON keys – NOT DB columns
      badge_level: badge?.level ?? null,
      badge_awarded_at: badge?.awarded_at ?? null,
    };

    return NextResponse.json({ ok: true, overview, scores });
  } catch (err) {
    console.error("overview error:", err);
    return NextResponse.json(
      { ok: false, error: String(err.message || err) },
      { status: 500 }
    );
  }
}
