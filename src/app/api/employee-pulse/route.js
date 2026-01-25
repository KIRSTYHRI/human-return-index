import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// position -> column in pulse_check_submissions (RAW 1–5 stored here)
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

function looksLikeUuid(s) {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}

function clamp1to5(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function scaledFromRaw1to5(raw) {
  // 1..5 -> 20..100
  return raw == null ? 0 : raw * 20;
}

function calcSummaryScaled(scaledByPos) {
  const v = (p) => Number(scaledByPos[p] ?? 0);
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

export async function POST(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  try {
    const body = await req.json();

    const organisation_id =
      body?.organisation_id || body?.organization_id || body?.org_id || null;

    if (!organisation_id) {
      return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
    }
    if (!looksLikeUuid(String(organisation_id))) {
      return NextResponse.json(
        { ok: false, error: "organisation_id must be a valid UUID" },
        { status: 400 }
      );
    }

    const employee_email = body?.employee_email || null;

    // ✅ Accept BOTH formats:
    // A) object: { q1: 5, ..., q10: 4 }
    // B) array:  [{ question_id, response_value }, ...]  (uses hri_pulse_questions.position)
    const rawByPos = {};

    // A) object form
    if (body?.responses && !Array.isArray(body.responses) && typeof body.responses === "object") {
      for (let pos = 1; pos <= 10; pos++) {
        rawByPos[pos] = clamp1to5(body.responses[`q${pos}`]);
      }
    }

    // B) array form
    if (Array.isArray(body?.responses)) {
      if (body.responses.length !== 10) {
        return NextResponse.json(
          { ok: false, error: `Expected 10 responses, got ${body.responses.length}` },
          { status: 400 }
        );
      }

      const ids = body.responses.map((r) => r.question_id).filter(Boolean);

      const { data: qRows, error: qErr } = await supabase
        .from("hri_pulse_questions")
        .select("id, position")
        .in("id", ids);

      if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });

      const posById = Object.fromEntries((qRows || []).map((q) => [q.id, q.position]));

      for (const r of body.responses) {
        const pos = posById[r.question_id];
        if (!pos) continue;
        rawByPos[pos] = clamp1to5(r.response_value);
      }
    }

    // Validate we have 10 values
    const rawList = [];
    for (let pos = 1; pos <= 10; pos++) rawList.push(rawByPos[pos]);

    if (rawList.some((v) => v == null)) {
      return NextResponse.json(
        { ok: false, error: "All q1..q10 must be numbers 1–5" },
        { status: 400 }
      );
    }

    // Build scaled scores for summary (20..100)
    const scaledByPos = {};
    for (let pos = 1; pos <= 10; pos++) {
      scaledByPos[pos] = scaledFromRaw1to5(rawByPos[pos]);
    }

    const summary = calcSummaryScaled(scaledByPos);

    // ✅ IMPORTANT:
    // - store RAW 1–5 in the q1..q10 columns (to satisfy DB checks like q10 1–5)
    // - store SCALED summary in total/pillars/avg
    const submissionPayload = {
      organization_id: String(organisation_id),
      organisation_id: String(organisation_id), // if this column exists in your table
      employee_email,
      submitted_at: new Date().toISOString(),
      ...summary,
    };

    for (const [posStr, col] of Object.entries(POS_TO_COL)) {
      submissionPayload[col] = rawByPos[Number(posStr)];
    }

    const { data: submission, error: subErr } = await supabase
      .from("pulse_check_submissions")
      .insert(submissionPayload)
      .select("*")
      .single();

    if (subErr) {
      return NextResponse.json({ ok: false, error: subErr.message }, { status: 500 });
    }

    // Optional raw storage table (safe)
    if (Array.isArray(body?.responses)) {
      const rawRows = body.responses.map((r) => ({
        pulse_id: submission.id,
        question_id: r.question_id,
        response_value: clamp1to5(r.response_value),
        created_at: new Date().toISOString(),
      }));
      await supabase.from("employee_pulse_responses").insert(rawRows);
    }

    return NextResponse.json({ ok: true, submission }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const organisation_id = searchParams.get("organisation_id") || searchParams.get("organization_id");

  if (!organisation_id) {
    return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
  }

  // Prefer uuid column if it exists
  let query = supabase
    .from("pulse_check_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(20);

  // try new column first
  query = query.eq("organisation_id", String(organisation_id));

  const { data, error } = await query;

  if (error) {
    // fallback to old column if needed
    const { data: data2, error: error2 } = await supabase
      .from("pulse_check_submissions")
      .select("*")
      .eq("organization_id", String(organisation_id))
      .order("submitted_at", { ascending: false })
      .limit(20);

    if (error2) return NextResponse.json({ ok: false, error: error2.message }, { status: 500 });
    return NextResponse.json({ ok: true, data: data2 || [] }, { status: 200 });
  }

  return NextResponse.json({ ok: true, data: data || [] }, { status: 200 });
}
