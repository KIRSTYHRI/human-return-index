import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

// Badge rules
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

    // 1️⃣ Remove any existing scores for this assessment
    const { error: deleteError } = await supabase
      .from("scores")
      .delete()
      .eq("assessment_id", assessment_id);

    if (deleteError) {
      console.error("Scores delete error:", deleteError);
      return NextResponse.json(
        { ok: false, error: deleteError.message },
        { status: 500 }
      );
    }

    // 2️⃣ Prepare rows
    const scoreRows = scores.map((s) => ({
      assessment_id,
      pillar: s.pillar,
      score: Number(s.score),
    }));

    // 3️⃣ INSERT fresh scores
    const { error: scoresError } = await supabase
      .from("scores")
      .insert(scoreRows);

    if (scoresError) {
      console.error("Scores insert error:", scoresError);
      return NextResponse.json(
        { ok: false, error: scoresError.message },
        { status: 500 }
      );
    }

    // 4️⃣ Calculate overall score
    const numericScores = scoreRows
      .map((s) => (Number.isFinite(s.score) ? s.score : null))
      .filter((v) => v != null);

    const overallScore =
      numericScores.length > 0
        ? numericScores.reduce((sum, v) => sum + v, 0) / numericScores.length
        : null;

    // 5️⃣ Load assessment to compare badge
    const { data: assessment, error: assessError } = await supabase
      .from("assessments")
      .select("id, badge_level")
      .eq("id", assessment_id)
      .single();

    if (assessError) {
      console.error("Assessment fetch error:", assessError);
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

    // Only update badge if changed
    if (newBadge !== existingBadge) {
      updates.badge_level = newBadge;
      updates.badge_awarded_at = newBadge ? new Date().toISOString() : null;
    }

    // 6️⃣ Update assessment
    const { error: updateError } = await supabase
      .from("assessments")
      .update(updates)
      .eq("id", assessment_id);

    if (updateError) {
      console.error("Assessment update error:", updateError);
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
