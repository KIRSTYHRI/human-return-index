import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 1–5 -> 20–100
function to100(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return n * 20;
}

function avg(arr) {
  const vals = arr.filter((x) => x != null && Number.isFinite(Number(x)));
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + Number(v), 0) / vals.length;
}

// Normalise pillar_scores into array for UI
function normalizeScores(pillar_scores) {
  const obj = pillar_scores && typeof pillar_scores === "object" ? pillar_scores : {};
  return Object.entries(obj).map(([pillar, score]) => ({
    pillar,
    score: score == null ? null : Number(score),
  }));
}

// HRI v1 mapping: q1–q5 Pillar 1, q6–q10 Pillar 2, q11–q15 Pillar 3, q16–q20 Pillar 4, q21–q25 Pillar 5
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

/**
 * Tries to extract answers from common shapes:
 * - { q1: 1..5, q2: 1..5, ... q25: 1..5 }
 * - { responses: {...} } etc.
 * - { answers: {...} }
 * - { data: {...} }
 */
function extractAnswersFromRow(row) {
  const candidates = [
    row?.responses,
    row?.answers,
    row?.assessment_answers,
    row?.assessment_responses,
    row?.data,
    row?.payload,
    row?.form_data,
  ].filter(Boolean);

  for (const c of candidates) {
    // If nested object like { responses: {q1:..} } – unwrap
    if (c && typeof c === "object") {
      if (c.responses && typeof c.responses === "object") return c.responses;
      if (c.answers && typeof c.answers === "object") return c.answers;
      return c;
    }
  }

  return null;
}

// Compute pillar_scores + overall_score (0–100)
function computeScoresFromAnswers(answersObj) {
  // Expect keys like q1..q25 somewhere
  const buckets = {
    pillar_1: [],
    pillar_2: [],
    pillar_3: [],
    pillar_4: [],
    pillar_5: [],
  };

  // Support keys q1..q25 and also "q01" etc
  for (const [k, v] of Object.entries(answersObj || {})) {
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

  const pillar_scores = {
    pillar_1: p1,
    pillar_2: p2,
    pillar_3: p3,
    pillar_4: p4,
    pillar_5: p5,
  };

  const overall_score = avg([p1, p2, p3, p4, p5]);

  return { overall_score, pillar_scores };
}

async function enforceOrgMatchIfAuthed(supabase, userData, row) {
  const { data: orgRow } = await supabase
    .from("organisation_users")
    .select("organisation_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (orgRow?.organisation_id && orgRow.organisation_id !== row.org_id) {
    return { ok: false, status: 403, error: "Forbidden (org mismatch)" };
  }
  return { ok: true };
}

export async function GET(req) {
  try {
    const supabase = supabaseServer();
    const url = new URL(req.url);
    const assessment_id = url.searchParams.get("assessment_id");

    if (!assessment_id) {
      return NextResponse.json({ ok: false, error: "Missing assessment_id" }, { status: 400 });
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const authedUser = !userErr && userData?.user;

    const { data: row, error } = await supabase
      .from("hri_assessments")
      .select("*")
      .eq("id", assessment_id)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!row?.id) return NextResponse.json({ ok: false, error: "Assessment not found" }, { status: 404 });

    if (authedUser) {
      const chk = await enforceOrgMatchIfAuthed(supabase, userData, row);
      if (!chk.ok) return NextResponse.json({ ok: false, error: chk.error }, { status: chk.status });
    }

    return NextResponse.json({
      ok: true,
      assessment: {
        id: row.id,
        org_id: row.org_id,
        title: row.title,
        overall_score: row.overall_score,
        created_at: row.created_at,
      },
      scores: normalizeScores(row.pillar_scores),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth session missing!" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const assessment_id = body?.assessment_id || body?.id || null;

    if (!assessment_id) {
      return NextResponse.json({ ok: false, error: "Missing assessment_id in body" }, { status: 400 });
    }

    // Pull assessment row
    const { data: row, error } = await supabase
      .from("hri_assessments")
      .select("*")
      .eq("id", assessment_id)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!row?.id) return NextResponse.json({ ok: false, error: "Assessment not found" }, { status: 404 });

    // Ensure org match
    const chk = await enforceOrgMatchIfAuthed(supabase, userData, row);
    if (!chk.ok) return NextResponse.json({ ok: false, error: chk.error }, { status: chk.status });

    // If already scored, return it
    const existingOverall = row.overall_score;
    const existingPillars = row.pillar_scores;
    const hasScores =
      (existingOverall != null && Number.isFinite(Number(existingOverall))) ||
      (existingPillars && typeof existingPillars === "object" && Object.keys(existingPillars).length > 0);

    if (hasScores) {
      return NextResponse.json({
        ok: true,
        updated: false,
        assessment_id: row.id,
        overall_score: row.overall_score ?? null,
        pillar_scores: row.pillar_scores ?? {},
      });
    }

    // Extract answers from common JSON columns
    const answersObj = extractAnswersFromRow(row);
    if (!answersObj) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No answers found on hri_assessments row. Store answers on the assessment (e.g. responses/answers/data) OR tell me where they are stored and I’ll wire scoring to that table.",
        },
        { status: 400 }
      );
    }

    const { overall_score, pillar_scores } = computeScoresFromAnswers(answersObj);

    if (overall_score == null) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Could not compute score. Expected answers like q1..q25 with values 1–5. If your keys differ, paste a sample of the saved answers object and I’ll map it properly.",
          debug_sample_keys: Object.keys(answersObj).slice(0, 30),
        },
        { status: 400 }
      );
    }

    // Update assessment row
    const { data: updated, error: upErr } = await supabase
      .from("hri_assessments")
      .update({
        overall_score,
        pillar_scores,
      })
      .eq("id", assessment_id)
      .select("id, overall_score, pillar_scores")
      .maybeSingle();

    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      updated: true,
      assessment_id: updated?.id || assessment_id,
      overall_score: updated?.overall_score ?? null,
      pillar_scores: updated?.pillar_scores ?? {},
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
