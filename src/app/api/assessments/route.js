import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org id we’ve been using
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET(request) {
  try {
    // Optional ?limit= param (default 20)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) || 20 : 20;

    // 1) Get all assessments for this org
    const { data: assessments, error: aErr } = await supabase
      .from("assessments")
      .select(
        "id, title, status, created_at, period_start, period_end, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (aErr) throw aErr;

    if (!assessments || assessments.length === 0) {
      return NextResponse.json({
        ok: true,
        assessments: [],
      });
    }

    const assessmentIds = assessments.map((a) => a.id);

    // 2) Pull all scores for those assessments
    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("assessment_id, pillar, score")
      .in("assessment_id", assessmentIds);

    if (sErr) throw sErr;

    // 3) Group scores by assessment and calculate overall
    const scoresByAssessment = {};
    for (const row of scores || []) {
      if (!scoresByAssessment[row.assessment_id]) {
        scoresByAssessment[row.assessment_id] = [];
      }
      scoresByAssessment[row.assessment_id].push(row);
    }

    const enriched = assessments.map((a) => {
      const s = scoresByAssessment[a.id] || [];
      const numericScores = s
        .map((r) => Number(r.score))
        .filter((n) => Number.isFinite(n));

      const overall =
        numericScores.length > 0
          ? numericScores.reduce((sum, n) => sum + n, 0) / numericScores.length
          : null;

      return {
        id: a.id,
        title: a.title,
        status: a.status,
        period_start: a.period_start,
        period_end: a.period_end,
        created_at: a.created_at,
        badge_level: a.badge_level,
        badge_awarded_at: a.badge_awarded_at,
        overall_score: overall,
      };
    });

    return NextResponse.json({
      ok: true,
      assessments: enriched,
    });
  } catch (err) {
    console.error("Error in /api/assessments:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
