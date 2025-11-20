import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org id as /api/overview
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

// GET → return current pillar scores for latest assessment
export async function GET() {
  try {
    // 1) Latest assessment for this org
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select("id")
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

    return NextResponse.json({
      ok: true,
      scores: scores || [],
    });
  } catch (err) {
    console.error("Error in GET /api/pillar-scores:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST → replace pillar scores for latest assessment
export async function POST(request) {
  try {
    const body = await request.json();
    const { scores } = body || {};

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { ok: false, error: "scores must be a non-empty array" },
        { status: 400 }
      );
    }

    // 1) Latest assessment
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select("id")
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

    // 2) Delete existing scores for that assessment
    const { error: delErr } = await supabase
      .from("scores")
      .delete()
      .eq("assessment_id", assessment.id);

    if (delErr) throw delErr;

    // 3) Insert new scores
    const rows = scores.map((s) => ({
      assessment_id: assessment.id,
      pillar: s.pillar,
      score: s.score,
    }));

    const { data: inserted, error: insErr } = await supabase
      .from("scores")
      .insert(rows)
      .select("pillar, score");

    if (insErr) throw insErr;

    return NextResponse.json({
      ok: true,
      scores: inserted || [],
    });
  } catch (err) {
    console.error("Error in POST /api/pillar-scores:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
