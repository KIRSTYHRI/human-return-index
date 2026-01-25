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

function looksLikeUuid(s) {
  return (
    typeof s === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
  );
}

// UI safety
const clamp15 = (n) => Math.max(1, Math.min(5, Number(n)));
const scaleTo100 = (n15) => clamp15(n15) * 20; // 1..5 -> 20..100

// Summary must be based on SCALED 20..100 values so avg/pillars make sense
function calcSummary(valuesByPosScaled) {
  const v = (p) => Number(valuesByPosScaled[p] ?? 0);
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
    const body = await req.json().catch(() => ({}));

    const organisation_id =
      body?.organisation_id || body?.organization_id || body?.org_id || null;

    const employee_email = body?.employee_email || null;

    if (!organisation_id) {
      return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
    }
    if (!looksLikeUuid(String(organisation_id))) {
      return NextResponse.json(
        { ok: false, error: "organisation_id must be a valid UUID" },
        { status: 400 }
      );
    }

    // We support BOTH formats:
    // A) responses: { q1: 5, q2: 4, ... q10: 5 }
    // B) responses: [ { question_id, response_value }, ... ]  (10 items)

    let valuesByPosRaw15 = {};   // 1..5
    let valuesByPosScaled = {};  // 20..100
    let rawRows = [];            // for employee_pulse_responses (only when we have question_id)

    // ---------- FORMAT A: object ----------
    if (body?.responses && typeof body.responses === "object" && !Array.isArray(body.responses)) {
      const r = body.responses;

      const expectedKeys = Array.from({ length: 10 }, (_, i) => `q${i + 1}`);
      const presentCount = expectedKeys.filter((k) => r[k] !== undefined && r
