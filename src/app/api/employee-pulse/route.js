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

// Map question "position" (1–10) -> DB column in employee_pulse_responses
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

// Pillar groupings by position (matches your current 10 questions)
function calcPillars(valuesByPos) {
  const v = (p) => Number(valuesByPos[p] ?? 0);

  const pillar_1 = (v(1) + v(2)) / 2;   // Leadership
  const pillar_2 = (v(3) + v(4)) / 2;   // Wellbeing & MH
  const pillar_3 = (v(5) + v(6)) / 2;   // Inclusion
  const pillar_4 = (v(7) + v(8)) / 2;   // Growth
  const pillar_5 = (v(9) + v(10)) / 2;  // Trust & Comms

  const total = Object.keys(POS_TO_COL).reduce((sum, p) => sum + v(Number(p)), 0);
  const avg = total / 10;

  return {
    total_score: total,
    average_score: avg,
    pillar_1_score: pillar_1,
    pillar_2_score: pillar_2,
    pillar_3_score: pillar_3,
    pillar_4_score: pillar_4,
    pillar_5_score: pillar_5,
  };
}

export async function POST(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing env vars (check Vercel env + redeploy)" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    // Accept either spelling, but store into DB as "organization_id"
    const organisation_id =
      body?.organisation_id ||
      body?.organization_id ||
      body?.org_id ||
      null;

    const employee_email = body?.employee_email || null;
    const responses = Array.isArray(body?.responses) ? body.responses : [];

    // Hard stop if org id is missing (your DB requires it)
    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id" },
        { status: 400 }
      );
    }

    if (responses.length !== 10) {
      return NextResponse.json(
        { ok: false, error: `Expected 10 responses, got ${responses.length}` },
        { status: 400 }
      );
    }

    // Pull positions for these questions so we can map them correctly
    const ids = responses.map((r) => r.question_id).filter(Boolean);

    const { data: qRows, error: qErr } = await supabase
      .from("hri_pulse_questions")
      .select("id, position")
      .in("id", ids);

    if (qErr) {
      return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
    }

    const posById = Object.fromEntries((qRows || []).map((q) => [q.id, q.position]));

    // Build valuesByPos {1:5, 2:3, ...}
    const valuesByPos = {};
    for (const r of responses) {
      const pos = posById[r.question_id];
      if (!pos) continue;
      valuesByPos[pos] = Number(r.response_value);
    }

    // Build insert payload for employee_pulse_responses
    const payload = {
      organization_id: String(organisation_id),
      employee_email,
    };

    for (const [posStr, col] of Object.entries(POS_TO_COL)) {
      const pos = Number(posStr);
      payload[col] = Number(valuesByPos[pos] ?? null);
    }

    Object.assign(payload, calcPillars(valuesByPos));

    const { data, error } = await supabase
      .from("employee_pulse_responses")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

// Optional: fetch latest submissions for an org
export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const organisation_id =
    searchParams.get("organisation_id") ||
    searchParams.get("organization_id") ||
    null;

  if (!organisation_id) {
    return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("employee_pulse_responses")
    .select("*")
    .eq("organization_id", String(organisation_id))
    .order("submitted_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data || [] }, { status: 200 });
}
