import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Just to keep things consistent with your five pillars
const PILLARS = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

// GET /api/hri-scores?assessment_id=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessment_id");

    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: "Missing assessment_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessmentId);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      scores: data || [],
    });
  } catch (err) {
    console.error("Error in GET /api/hri-scores:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/hri-scores
// body: { assessment_id: string, scores: { [pillar]: number } }
export async function POST(request) {
  try {
    const body = await request.json();
    const { assessment_id, scores } = body || {};

    if (!assessment_id) {
      return NextResponse.json(
        { ok: false, error: "assessment_id is required" },
        { status: 400 }
      );
    }

    if (!scores || typeof scores !== "object") {
      return NextResponse.json(
        { ok: false, error: "scores object is required" },
        { status: 400 }
      );
    }

    // Normalise & filter scores for the known pillars
    const rows = [];

    for (const pillar of PILLARS) {
      const raw = scores[pillar];
      if (raw === null || raw === undefined || raw === "") continue;

      const num = Number(raw);
      if (!Number.isFinite(num)) continue;

      rows.push({
        assessment_id,
        pillar,
        score: num,
      });
    }

    // Simple approach: wipe existing scores for this assessment, then insert fresh
    const { error: delErr } = await supabase
      .from("scores")
      .delete()
      .eq("assessment_id", assessment_id);

    if (delErr) throw delErr;

    let inserted = [];
    if (rows.length > 0) {
      const { data, error: insErr } = await supabase
        .from("scores")
        .insert(rows)
        .select("pillar, score");

      if (insErr) throw insErr;
      inserted = data || [];
    }

    return NextResponse.json({
      ok: true,
      scores: inserted,
    });
  } catch (err) {
    console.error("Error in POST /api/hri-scores:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
