import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req) {
  try {
    const supabase = supabaseServer();
    const body = await req.json();

    const organisation_id = body?.organisation_id || body?.organization_id || null;
    const responses = body?.responses || null;
    const employee_email = body?.employee_email || null;

    if (!organisation_id) {
      return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
    }

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
    const vals = [q1,q2,q3,q4,q5,q6,q7,q8,q9,q10].filter((v) => v != null);
    const total_score = vals.reduce((s, v) => s + v, 0);
    const average_score = vals.length ? total_score / vals.length : null;

    // Pillar scores (2 qs per pillar, adjust if yours differs)
    const pillar_1_score = (q1 != null && q2 != null) ? (q1 + q2) / 2 : null;
    const pillar_2_score = (q3 != null && q4 != null) ? (q3 + q4) / 2 : null;
    const pillar_3_score = (q5 != null && q6 != null) ? (q5 + q6) / 2 : null;
    const pillar_4_score = (q7 != null && q8 != null) ? (q7 + q8) / 2 : null;
    const pillar_5_score = (q9 != null && q10 != null) ? (q9 + q10) / 2 : null;

    const insertRow = {
      // your table has BOTH columns, so we set both to keep everything happy:
      organisation_id,                 // uuid column
      organization_id: String(organisation_id), // text column
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

    const { data, error } = await supabase
      .from("pulse_check_submissions")
      .insert(insertRow)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // ✅ ALWAYS return the ID in a predictable place
    return NextResponse.json({
      ok: true,
      pulse_id: data?.id || null,
      submission: data,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
