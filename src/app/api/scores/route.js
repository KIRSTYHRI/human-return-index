import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

export async function POST(req) {
  try {
    const body = await req.json();
    const { assessment_id, scores } = body || {};

    if (!assessment_id) {
      return NextResponse.json(
        { ok: false, error: "assessment_id is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { ok: false, error: "scores must be a non-empty array" },
        { status: 400 }
      );
    }

    // 1) Clear existing scores for this assessment
    const { error: delErr } = await supabase
      .from("scores")
      .delete()
      .eq("assessment_id", assessment_id);

    if (delErr) throw delErr;

    // 2) Insert the new scores
    const rows = scores.map((s) => ({
      assessment_id,
      pillar: s.pillar,
      score: Number(s.score),
    }));

    const { error: insErr } = await supabase.from("scores").insert(rows);

    if (insErr) throw insErr;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in /api/scores:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
