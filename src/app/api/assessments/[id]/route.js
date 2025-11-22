import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL in /api/assessments/[id]");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY in /api/assessments/[id]");

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// PILLARS we support in the MVP
const PILLARS = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

// GET – load one assessment + its scores
export async function GET(_req, { params }) {
  const { id } = params;

  try {
    // 1) Assessment itself
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select(
        "id, organisation_id, title, status, period_start, period_end, created_at, badge_level, badge_awarded_at, is_current",
      )
      .eq("id", id)
      .maybeSingle();

    if (aErr) throw aErr;
    if (!assessment) {
      return NextResponse.json(
        { ok: false, error: "Assessment not found" },
        { status: 404 },
      );
    }

    // 2) Pillar scores for this assessment
    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", id);

    if (sErr) throw sErr;

    return NextResponse.json({
      ok: true,
      assessment,
      scores: scores || [],
    });
  } catch (err) {
    console.error("Error in GET /api/assessments/[id]:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}

// POST – replace pillar scores for this assessment
export async function POST(req, { params }) {
  const { id } = params;

  try {
    const body = await req.json();
    const incomingScores = body.scores;

    if (!Array.isArray(incomingScores) || incomingScores.length === 0) {
      return NextResponse.json(
        { ok: false, error: "scores must be a non-empty array" },
        { status: 400 },
      );
    }

    // Clean + validate
    const cleaned = incomingScores
      .map((s) => {
        const pillar = String(s.pillar || "").trim();
        const scoreNum = Number(s.score);

        if (!pillar || !PILLARS.includes(pillar)) {
          return null;
        }

        if (!Number.isFinite(scoreNum)) {
          return null;
        }

        // Clamp between 0–100 for safety
        const safeScore = Math.min(100, Math.max(0, scoreNum));

        return {
          assessment_id: id,
          pillar,
          score: safeScore,
        };
      })
      .filter(Boolean);

    if (cleaned.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid scores provided" },
        { status: 400 },
      );
    }

    // 1) Delete existing scores for this assessment
    const { error: delErr } = await supabase
      .from("scores")
      .delete()
      .eq("assessment_id", id);

    if (delErr) throw delErr;

    // 2) Insert new scores
    const { error: insErr } = await supabase
      .from("scores")
      .insert(cleaned);

    if (insErr) throw insErr;

    // 3) Re-fetch same as GET so the front-end can refresh
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select(
        "id, organisation_id, title, status, period_start, period_end, created_at, badge_level, badge_awarded_at, is_current",
      )
      .eq("id", id)
      .maybeSingle();

    if (aErr) throw aErr;

    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", id);

    if (sErr) throw sErr;

    return NextResponse.json({
      ok: true,
      assessment,
      scores: scores || [],
    });
  } catch (err) {
    console.error("Error in POST /api/assessments/[id]:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
