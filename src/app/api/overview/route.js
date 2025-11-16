import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// For now we hard-code your org id.
// Later we’ll make this dynamic per logged-in customer.
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  try {
    console.log("USING REAL /api/overview HANDLER");

    // 1) Latest assessment for your org
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select(
        "id, title, status, created_at, period_start, period_end, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) throw aErr;
    if (!assessment) {
      return NextResponse.json(
        { ok: false, error: "No assessment found for this organisation" },
        { status: 404 }
      );
    }

    // 2) All pillar scores for that assessment
    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    if (sErr) throw sErr;

    const numericScores =
      (scores || [])
        .map((s) => Number(s.score))
        .filter((n) => Number.isFinite(n));

    const overallScore =
      numericScores.length > 0
        ? numericScores.reduce((sum, n) => sum + n, 0) / numericScores.length
        : null;

    const overview = {
      assessment_id: assessment.id,
      title: assessment.title,
      status: assessment.status,
      assessment_created_at:
        assessment.created_at || assessment.period_start,
      period_start: assessment.period_start,
      period_end: assessment.period_end,
      badge_level: assessment.badge_level,
      badge_awarded_at: assessment.badge_awarded_at,
      overall_score: overallScore,
    };

    return NextResponse.json({
      ok: true,
      overview,
      scores: scores || [],
    });
  } catch (err) {
    console.error("Error in /api/overview:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
