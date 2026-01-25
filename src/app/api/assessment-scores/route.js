import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function tryFetchScores(supabase, assessment_id) {
  // Try table: scores
  const a = await supabase
    .from("scores")
    .select("pillar, score")
    .eq("assessment_id", assessment_id);

  if (!a.error) return a.data || [];

  // Fallback: hri_scores
  const b = await supabase
    .from("hri_scores")
    .select("pillar, score")
    .eq("assessment_id", assessment_id);

  if (!b.error) return b.data || [];

  // Fallback: pillar_scores (some builds store here)
  const c = await supabase
    .from("pillar_scores")
    .select("pillar, score")
    .eq("assessment_id", assessment_id);

  if (!c.error) return c.data || [];

  // If all fail, return empty but with last error
  return [];
}

export async function GET(req) {
  try {
    const supabase = supabaseServer();

    const url = new URL(req.url);
    const assessment_id = url.searchParams.get("assessment_id");
    if (!assessment_id) {
      return NextResponse.json({ ok: false, error: "Missing assessment_id" }, { status: 400 });
    }

    const scores = await tryFetchScores(supabase, assessment_id);

    return NextResponse.json({ ok: true, scores }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
