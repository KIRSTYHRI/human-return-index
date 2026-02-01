import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

<<<<<<< HEAD
const VERSION = "ASSESSMENT_SCORES_V2__FETCH_RESPONSES_FROM_DB__POST_ASSESSMENT_ID";

// 1–5 -> 20–100
=======
const VERSION = "ASSESSMENT_SCORES_V2__POST_ASSESSMENT_ID__READ_RESPONSES_COL";

>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
function to100(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return n * 20;
}

function avg(arr) {
  const vals = arr.filter((x) => x != null && Number.isFinite(Number(x)));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + Number(v), 0) / vals.length;
}

function mapQuestionsToPillars(q) {
  const n = Number(q);
  if (!Number.isFinite(n)) return null;
  if (n >= 1 && n <= 5) return "pillar_1";
  if (n >= 6 && n <= 10) return "pillar_2";
  if (n >= 11 && n <= 15) return "pillar_3";
  if (n >= 16 && n <= 20) return "pillar_4";
  if (n >= 21 && n <= 25) return "pillar_5";
  return null;
}

function computeScores(responses) {
  const buckets = { pillar_1: [], pillar_2: [], pillar_3: [], pillar_4: [], pillar_5: [] };

  for (const [k, v] of Object.entries(responses || {})) {
    const match = String(k).match(/^q(\d{1,2})$/i);
    if (!match) continue;

    const qNum = Number(match[1]);
    const pillar = mapQuestionsToPillars(qNum);
    if (!pillar) continue;

    buckets[pillar].push(to100(v));
  }

  const p1 = avg(buckets.pillar_1);
  const p2 = avg(buckets.pillar_2);
  const p3 = avg(buckets.pillar_3);
  const p4 = avg(buckets.pillar_4);
  const p5 = avg(buckets.pillar_5);

  const pillar_scores = { pillar_1: p1, pillar_2: p2, pillar_3: p3, pillar_4: p4, pillar_5: p5 };
  const overall_score = avg([p1, p2, p3, p4, p5]);

  return { overall_score, pillar_scores };
}

<<<<<<< HEAD
// Optional: GET for quick viewing
export async function GET(req) {
  return NextResponse.json({ ok: true, version: VERSION, message: "POST { assessment_id } to score." });
=======
export async function GET() {
  return NextResponse.json({ ok: true, version: VERSION, message: "POST { assessment_id } to calculate and save scores." });
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
}

export async function POST(req) {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
<<<<<<< HEAD
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const assessment_id = body?.assessment_id || null;

    if (!assessment_id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Missing assessment_id" }, { status: 400 });
    }

    // Fetch assessment (RLS applies; you fixed org access)
    const { data: row, error } = await supabase
      .from("hri_assessments")
      .select("id, org_id, title, responses, overall_score, pillar_scores")
      .eq("id", assessment_id)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, version: VERSION, error: error.message }, { status: 500 });
    if (!row?.id) return NextResponse.json({ ok: false, version: VERSION, error: "Assessment not found" }, { status: 404 });

    const responses = row.responses && typeof row.responses === "object" ? row.responses : {};

    if (!Object.keys(responses).length) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No responses stored on this assessment yet (responses is empty)." },
        { status: 400 }
      );
    }

    const { overall_score, pillar_scores } = computeScores(responses);

    if (overall_score == null) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "Could not compute score. Expected q1..q25 with values 1–5 in responses.",
          sample_keys: Object.keys(responses).slice(0, 30),
        },
        { status: 400 }
      );
    }

    const { data: updated, error: upErr } = await supabase
      .from("hri_assessments")
      .update({ overall_score, pillar_scores })
      .eq("id", assessment_id)
      .select("id, overall_score, pillar_scores")
      .maybeSingle();

    if (upErr) return NextResponse.json({ ok: false, version: VERSION, error: upErr.message }, { status: 500 });

=======
      return NextResponse.json({ ok: false, version: VERSION, error: "Auth session missing!" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const assessment_id = body?.assessment_id || null;

    if (!assessment_id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Missing assessment_id" }, { status: 400 });
    }

    const { data: row, error } = await supabase
      .from("hri_assessments")
      .select("id, org_id, title, responses, overall_score, pillar_scores")
      .eq("id", assessment_id)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, version: VERSION, error: error.message }, { status: 500 });
    if (!row?.id) return NextResponse.json({ ok: false, version: VERSION, error: "Assessment not found" }, { status: 404 });

    const responses = row.responses && typeof row.responses === "object" ? row.responses : {};
    if (!Object.keys(responses).length) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No responses stored on this assessment yet (responses is empty)." },
        { status: 400 }
      );
    }

    const { overall_score, pillar_scores } = computeScores(responses);

    if (overall_score == null) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "Could not compute score. Expected q1..q25 with values 1–5 in responses.",
          sample_keys: Object.keys(responses).slice(0, 30),
        },
        { status: 400 }
      );
    }

    const { data: updated, error: upErr } = await supabase
      .from("hri_assessments")
      .update({ overall_score, pillar_scores })
      .eq("id", assessment_id)
      .select("id, overall_score, pillar_scores")
      .maybeSingle();

    if (upErr) return NextResponse.json({ ok: false, version: VERSION, error: upErr.message }, { status: 500 });

>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
    return NextResponse.json({
      ok: true,
      version: VERSION,
      updated: true,
      assessment_id: updated.id,
      overall_score: updated.overall_score,
      pillar_scores: updated.pillar_scores,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, version: VERSION, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
<<<<<<< HEAD
=======

>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
