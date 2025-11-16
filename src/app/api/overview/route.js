import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

export async function GET() {
  try {
    // 1) Get the latest assessment for your org
    const { data: assessment, error: aError } = await supabase
      .from("assessments")
      .select(
        "id, title, status, period_start, period_end, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", "9499b1b9-7fce-43a1-9590-d533f00dc71d")
      .order("id", { ascending: false }) // if you add created_at later, change this
      .limit(1)
      .maybeSingle();

    if (aError) {
      console.error("Assessment error:", aError);
      return NextResponse.json(
        { ok: false, error: aError.message },
        { status: 500 }
      );
    }

    // No assessment yet – return empty but ok:true
    if (!assessment) {
      return NextResponse.json({
        ok: true,
        overview: null,
        scores: [],
      });
    }

    // 2) Get scores for that assessment
    const { data: scores, error: sError } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    if (sError) {
      console.error("Scores error:", sError);
      return NextResponse.json(
        { ok: false, error: sError.message },
        { status: 500 }
      );
    }

    // 3) Shape the response for the dashboard
    return NextResponse.json({
      ok: true,
      overview: {
        assessment_id: assessment.id,
        title: assessment.title,
        status: assessment.status,
        // we don’t rely on created_at here, to avoid column issues
        assessment_created_at: assessment.period_start,
        period_start: assessment.period_start,
        period_end: assessment.period_end,
        badge_level: assessment.badge_level ?? null,
        badge_awarded_at: assessment.badge_awarded_at ?? null,
      },
      scores: scores ?? [],
    });
  } catch (err) {
    console.error("Overview fatal error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
