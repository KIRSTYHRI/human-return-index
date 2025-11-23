import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

function computeBadge(overallScore) {
  if (overallScore == null) return null;
  if (overallScore >= 80) return "HRI Accredited Plus";
  if (overallScore >= 60) return "HRI Accredited";
  return null;
}

export async function POST(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { assessment_id, scores } = body;

    if (!assessment_id || !Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Missing assessment_id or scores" },
        { status: 400 }
      );
    }

    // 1️⃣ Upsert pillar scores into scores table
    const scoreRows = scores.map((s) => ({
      assessment_id,
      pillar: s.pillar,
      score: Number(s.score),
    }));

    const { error: scoresError } = await supabase
      .from("scores")
      .upsert(scoreRows, { onConflict: "assessment_id,pillar" });

    if (scoresError) {
      return NextResponse.json(
        { ok: false, error: scoresError.message },
        { status: 500 }
      );
    }

    // 2️⃣ Compute overall average score
    const numericScores = scoreRows
      .map((s) => (Number.isFinite(s.score) ? s.score : null))
      .filter((v) => v != null);

    const overallScore =
      numericScores.length > 0
        ? numericScores.reduce((sum, v) => sum + v, 0) / numericScores.length
        : null;

    // 3️⃣ Fetch existing assessment for current badge
    const { data: assessment, error: assessError } = await supabase
      .from("assessments")
      .select("id, overall_score, badge_level, badge_awarded_at")
      .eq("id", assessment_id)
      .single();

    if (assessError) {
      return NextResponse.json(
        { ok: false, error: assessError.message },
        { status: 500 }
      );
    }

    const newBadge = computeBadge(overallScore);
    const existingBadge = assessment.badge_level;

    const updates = {
      overall_score: overallScore,
    };

    // 4️⃣ Only update badge fields if the level has changed
    if (newBadge !== existingBadge) {
      updates.badge_level = newBadge;
      updates.badge_awarded_at = newBadge ? new Date().toISOString() : null;
    }

    const { error: updateError } = await supabase
      .from("assessments")
      .update(updates)
      .eq("id", assessment_id);

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      overall_score: overallScore,
      badge_level: newBadge ?? existingBadge ?? null,
    });
  } catch (err) {
    console.error("Error in scores API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
