import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

<<<<<<< HEAD
function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
=======
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// position -> column in pulse_check_submissions
const POS_TO_COL = {
  1: "q1_leadership_vision",
  2: "q2_leadership_cares",
  3: "q3_work_life_balance",
  4: "q4_wellbeing_support",
  5: "q5_valued_included",
  6: "q6_treated_fairly",
  7: "q7_growth_opportunities",
  8: "q8_feedback_helps",
  9: "q9_trust_colleagues",
  10: "q10_clear_communication",
};

// ✅ only allow 1..5, otherwise NULL (prevents DB constraint failure)
function safe15(x) {
  if (x === null || x === undefined) return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  if (i < 1 || i > 5) return null;
  return i;
}

function calcSummary(valuesByPos) {
  const v = (p) => safe15(valuesByPos[p]) ?? 0;

  const total = Object.keys(POS_TO_COL).reduce((sum, p) => sum + v(Number(p)), 0);
  const avg = total / 10;

  return {
    total_score: total,
    average_score: avg,
    pillar_1_score: (v(1) + v(2)) / 2,
    pillar_2_score: (v(3) + v(4)) / 2,
    pillar_3_score: (v(5) + v(6)) / 2,
    pillar_4_score: (v(7) + v(8)) / 2,
    pillar_5_score: (v(9) + v(10)) / 2,
  };
}

// Basic UUID check (prevents junk IDs being stored)
function looksLikeUuid(s) {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}

// Helper: accept BOTH formats:
// 1) responses: { q1: 5, ... q10: 4 }
// 2) responses: [ {question_id, response_value}, ... ]
function normaliseResponses(body) {
  const raw = body?.responses;

  // object format (q1..q10)
  if (raw && !Array.isArray(raw) && typeof raw === "object") {
    const out = [];
    for (let i = 1; i <= 10; i++) {
      const key = `q${i}`;
      out.push({ position: i, response_value: raw[key] });
    }
    return out;
  }

  // array format (question_id + response_value)
  if (Array.isArray(raw)) return raw;

  return [];
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
}

export async function POST(req) {
  try {
    const supabase = supabaseServer();

    // ✅ (Recommended) Require auth session
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth session missing!" }, { status: 401 });
    }

    const body = await req.json();

    const organisation_id = body?.organisation_id || body?.organization_id || null;
    const responses = body?.responses || null;
    const employee_email = body?.employee_email || null;
<<<<<<< HEAD
=======
    const responses = normaliseResponses(body);
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)

    if (!organisation_id) {
      return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
    }
<<<<<<< HEAD

    // Expect responses as { q1: 1..5, ... q10: 1..5 }
    if (!responses || typeof responses !== "object") {
      return NextResponse.json({ ok: false, error: "Missing responses object" }, { status: 400 });
    }

    const q1 = numOrNull(responses.q1);
    const q2 = numOrNull(responses.q2);
    const q3 = numOrNull(responses.q3);
    const q4 = numOrNull(responses.q4);
    const q5 = numOrNull(responses.q5);
    const q6 = numOrNull(responses.q6);
    const q7 = numOrNull(responses.q7);
    const q8 = numOrNull(responses.q8);
    const q9 = numOrNull(responses.q9);
    const q10 = numOrNull(responses.q10);

    // Totals (only count non-null)
    const vals = [q1, q2, q3, q4, q5, q6, q7, q8, q9, q10].filter((v) => v != null);
    const total_score = vals.reduce((s, v) => s + v, 0);
    const average_score = vals.length ? total_score / vals.length : null;

    // Pillar scores (2 qs per pillar)
    const pillar_1_score = q1 != null && q2 != null ? (q1 + q2) / 2 : null;
    const pillar_2_score = q3 != null && q4 != null ? (q3 + q4) / 2 : null;
    const pillar_3_score = q5 != null && q6 != null ? (q5 + q6) / 2 : null;
    const pillar_4_score = q7 != null && q8 != null ? (q7 + q8) / 2 : null;
    const pillar_5_score = q9 != null && q10 != null ? (q9 + q10) / 2 : null;

    const insertRow = {
      // your table has BOTH columns, so we set both to keep everything happy:
      organisation_id, // uuid column
      organization_id: String(organisation_id), // text column
=======
    if (!looksLikeUuid(String(organisation_id))) {
      return NextResponse.json({ ok: false, error: "organisation_id must be a valid UUID" }, { status: 400 });
    }

    // Build valuesByPos
    const valuesByPos = {};

    // If array contains positions already (from object format)
    if (responses.length === 10 && responses[0]?.position) {
      for (const r of responses) {
        valuesByPos[r.position] = safe15(r.response_value);
      }
    } else {
      // array format must be 10 items with question_id
      if (responses.length !== 10) {
        return NextResponse.json(
          { ok: false, error: `Expected 10 responses, got ${responses.length}` },
          { status: 400 }
        );
      }

      const ids = responses.map((r) => r.question_id).filter(Boolean);

      const { data: qRows, error: qErr } = await supabase
        .from("hri_pulse_questions")
        .select("id, position")
        .in("id", ids);

      if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });

      const posById = Object.fromEntries((qRows || []).map((q) => [q.id, q.position]));

      for (const r of responses) {
        const pos = posById[r.question_id];
        if (pos) valuesByPos[pos] = safe15(r.response_value);
      }
    }

    const summary = calcSummary(valuesByPos);

    // ✅ Write BOTH columns for compatibility
    const submissionPayload = {
      organization_id: String(organisation_id),
      organisation_id: String(organisation_id),
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
      employee_email,

      q1_leadership_vision: q1,
      q2_leadership_cares: q2,
      q3_work_life_balance: q3,
      q4_wellbeing_support: q4,
      q5_valued_included: q5,
      q6_treated_fairly: q6,
      q7_growth_opportunities: q7,
      q8_feedback_helps: q8,
      q9_trust_colleagues: q9,
      q10_clear_communication: q10,

      total_score,
      average_score,
      pillar_1_score,
      pillar_2_score,
      pillar_3_score,
      pillar_4_score,
      pillar_5_score,
    };

<<<<<<< HEAD
    const { data, error } = await supabase
=======
    // ✅ CRITICAL FIX: do NOT Number(null) -> 0
    for (const [posStr, col] of Object.entries(POS_TO_COL)) {
      const pos = Number(posStr);
      submissionPayload[col] = valuesByPos[pos] ?? null; // stays null if invalid/out of range
    }

    const { data: submission, error: subErr } = await supabase
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
      .from("pulse_check_submissions")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

<<<<<<< HEAD
    // ✅ ALWAYS return the ID in a predictable place
    return NextResponse.json({
      ok: true,
      id: data?.id || null,
      pulse_id: data?.id || null,
      submission: data,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
=======
    return NextResponse.json({ ok: true, submission }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
      { status: 500 }
    );
  }
}
<<<<<<< HEAD
=======

export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const organisation_id =
    searchParams.get("organisation_id") ||
    searchParams.get("organization_id");

  if (!organisation_id) {
    return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pulse_check_submissions")
    .select("*")
    .eq("organisation_id", String(organisation_id))
    .order("submitted_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data || [] }, { status: 200 });
}
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
