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

// Pillar calc based on 10 questions = 5 pillars (2 Qs each)
function calcSummary(valuesByPos) {
  const v = (p) => Number(valuesByPos[p] ?? 0);

  const pillar_1 = (v(1) + v(2)) / 2;   // Leadership
  const pillar_2 = (v(3) + v(4)) / 2;   // Wellbeing & MH
  const pillar_3 = (v(5) + v(6)) / 2;   // Inclusion
  const pillar_4 = (v(7) + v(8)) / 2;   // Growth
  const pillar_5 = (v(9) + v(10)) / 2;  // Trust & Comms

  const total = [1,2,3,4,5,6,7,8,9,10].reduce((sum, p) => sum + v(p), 0);
  const average = total / 10;

  return {
    total_score: total,
    average_score: average,
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

    const organization_id =
      body?.organization_id ||
      body?.organisation_id ||
      body?.org_id ||
      null;

    const employee_email = body?.employee_email || null;
    const responses = Array.isArray(body?.responses) ? body.responses : [];

    if (!organization_id) {
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

    // 1) Create submission row FIRST (gives pulse_id)
    const { data: pulseRow, error: pulseErr } = await supabase
      .from("pulse_check_submissions")
      .insert({
        organization_id: String(organization_id),
        employee_email,
      })
      .select("id")
      .single();

    if (pulseErr || !pulseRow?.id) {
      return NextResponse.json(
        { ok: false, error: pulseErr?.message || "Failed to create pulse submission" },
        { status: 500 }
      );
    }

    const pulse_id = pulseRow.id;

    // 2) Insert raw answers (this table is: pulse_id, question_id, response_value)
    const rawRows = responses.map((r) => ({
      pulse_id,
      question_id: r.question_id,
      response_value: Number(r.response_value),
    }));

    const { error: rawErr } = await supabase
      .from("employee_pulse_responses")
      .insert(rawRows);

    if (rawErr) {
      return NextResponse.json({ ok: false, error: rawErr.message }, { status: 500 });
    }

    // 3) Pull positions to calculate summary properly
    const ids = responses.map((r) => r.question_id).filter(Boolean);

    const { data: qRows, error: qErr } = await supabase
      .from("hri_pulse_questions")
      .select("id, position")
      .in("id", ids);

    if (qErr) {
      return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
    }

    const posById = Object.fromEntries((qRows || []).map((q) => [q.id, q.position]));
    const valuesByPos = {};

    for (const r of responses) {
      const pos = posById[r.question_id];
      if (pos) valuesByPos[pos] = Number(r.response_value);
    }

    const summary = calcSummary(valuesByPos);

    // 4) Try to store summary ON the submission row (if columns exist)
    // If columns don't exist, we ignore update failure and still return summary.
    const { error: updErr } = await supabase
      .from("pulse_check_submissions")
      .update({
        total_score: summary.total_score,
        average_score: summary.average_score,
        pillar_1_score: summary.pillar_1_score,
        pillar_2_score: summary.pillar_2_score,
        pillar_3_score: summary.pillar_3_score,
        pillar_4_score: summary.pillar_4_score,
        pillar_5_score: summary.pillar_5_score,
      })
      .eq("id", pulse_id);

    // Don’t fail the submission if summary columns aren’t there
    // (We still return computed summary)
    return NextResponse.json(
      { ok: true, pulse_id, summary, stored_summary: !updErr },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
