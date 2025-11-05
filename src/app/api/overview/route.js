import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing Supabase environment variables");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

export async function GET() {
  try {
    // Fetch the most recent assessment and its scores
    const { data: assessments, error: aErr } = await supabase
      .from("assessments")
      .select("id, title, status, created_at, badge_level, badge_awarded_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (aErr) throw aErr;

    const latest = assessments?.[0];
    if (!latest) return NextResponse.json({ ok: true, overview: null, scores: [] });

    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", latest.id);
    if (sErr) throw sErr;

    return NextResponse.json({
      ok: true,
      overview: {
        title: latest.title,
        status: latest.status,
        assessment_created_at: latest.created_at,
        badge_level: latest.badge_level,
        badge_awarded_at: latest.badge_awarded_at,
      },
      scores: scores || [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
