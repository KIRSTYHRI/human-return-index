import { NextResponse } from "next/server";
import { supabaseServer } from "../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ASSESSMENT_SCORES_V2__POST_ASSESSMENT_ID__READ_RESPONSES_COL";

// 1–5 -> 20–100
function to100(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n * 20;
}

function calcFromResponses(responses) {
  const vals = [];
  for (let i = 1; i <= 25; i++) {
    const v = to100(responses?.[`q${i}`]);
    if (v != null) vals.push(v);
  }

  const overall_score = vals.length
    ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    : null;

  const pillar_scores = {};
  for (let p = 1; p <= 5; p++) {
    const start = (p - 1) * 5 + 1;
    const end = start + 4;
    const pvals = [];
    for (let i = start; i <= end; i++) {
      const v = to100(responses?.[`q${i}`]);
      if (v != null) pvals.push(v);
    }
    pillar_scores[`pillar_${p}`] = pvals.length
      ? Math.round(pvals.reduce((a, b) => a + b, 0) / pvals.length)
      : null;
  }

  return { overall_score, pillar_scores };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: VERSION,
    message: "POST { assessment_id } to calculate and save scores.",
  });
}

export async function POST(req) {
  try {
    const supabase = supabaseServer();
    const body = await req.json().catch(() => ({}));

    const assessment_id = body?.assessment_id || null;
    if (!assessment_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Missing assessment_id" },
        { status: 400 }
      );
    }

    const { data: row, error: readErr } = await supabase
      .from("hri_assessments")
      .select("id, org_id, responses")
      .eq("id", assessment_id)
      .maybeSingle();

    if (readErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: readErr.message },
        { status: 500 }
      );
    }

    if (!row?.id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Assessment not found" },
        { status: 404 }
      );
    }

    const responses = row.responses || null;
    const count = responses && typeof responses === "object" ? Object.keys(responses).length : 0;

    if (!responses || count === 0) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "No responses stored on this assessment yet (responses is empty).",
        },
        { status: 400 }
      );
    }

    const { overall_score, pillar_scores } = calcFromResponses(responses);

    const { error: upErr } = await supabase
      .from("hri_assessments")
      .update({ overall_score, pillar_scores })
      .eq("id", assessment_id);

    if (upErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: upErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      updated: true,
      assessment_id,
      overall_score,
      pillar_scores,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
