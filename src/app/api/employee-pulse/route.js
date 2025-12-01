// src/app/api/employee-pulse/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use SERVICE_ROLE on server only (safe in API route)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Employee pulse – missing Supabase env vars", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { responses = [], meta = {} } = body || {};

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No responses submitted" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Supabase configuration missing on server. Check env vars in Vercel.",
        },
        { status: 500 }
      );
    }

    const rows = responses.map((r) => ({
      question_id: r.question_id,
      pillar: r.pillar,
      score_1_to_5: r.score1to5,
      score_0_to_100: r.score100,
      submitted_at: new Date().toISOString(),
      source: meta.source || "hri-dashboard-employee-pulse",
    }));

    const { error } = await supabase
      .from("hri_pulse_responses")
      .insert(rows);

    if (error) {
      console.error("Employee pulse insert error:", error);
      throw error;
    }

    const byPillar = new Map();
    for (const r of responses) {
      if (!r.pillar || typeof r.score100 !== "number") continue;
      if (!byPillar.has(r.pillar)) byPillar.set(r.pillar, []);
      byPillar.get(r.pillar).push(r.score100);
    }

    const pillarScores = [];
    let total = 0;
    let count = 0;

    for (const [pillar, values] of byPillar.entries()) {
      if (!values.length) continue;
      const avg = values.reduce((s, v) => s + v, 0) / values.length;
      const rounded = Math.round(avg);
      pillarScores.push({ pillar, score: rounded });
      total += rounded;
      count += 1;
    }

    const overallScore = count > 0 ? Math.round(total / count) : null;

    return NextResponse.json({
      ok: true,
      overallScore,
      pillarScores,
    });
  } catch (err) {
    console.error("Employee pulse route error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to submit employee pulse",
      },
      { status: 500 }
    );
  }
}
