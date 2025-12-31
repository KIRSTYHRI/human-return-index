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

// Map question position -> pillar buckets
function calcPillars(valuesByPos) {
  const v = (p) => Number(valuesByPos[p] ?? 0);

  const pillar_1 = (v(1) + v(2)) / 2;   // Leadership
  const pillar_2 = (v(3) + v(4)) / 2;   // Wellbeing & MH
  const pillar_3 = (v(5) + v(6)) / 2;   // Inclusion
  const pillar_4 = (v(7) + v(8)) / 2;   // Growth
  const pillar_5 = (v(9) + v(10)) / 2;  // Trust & Comms

  const total = [1,2,3,4,5,6,7,8,9,10].reduce((sum, p) => sum + v(p), 0);
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

    // IMPORTANT: your DB expects organization_id (American spelling) as text
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

    // 1) Create a pulse_check_submissions row (this gives us pulse_id)
    // Your earlier errors showed the column is organization_id (NOT organisation_id)
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

    // 2) Insert raw answers into employee_pulse_responses (one row per answer)
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

    // 3) Fetch question positions so we can calculate pillars properly
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

    const summary = calcPillars(valuesByPos);

    // 4) Insert a single summary row (THIS is what your dashboard needs)
    const { data: summaryRow, error: sumErr } = await supabase
      .from("employee_pulse_summary")
      .insert({
        organization_id: String(organization_id),
        pulse_id,
        ...summary,
      })
      .select("*")
      .single();

    if (sumErr) {
      return NextResponse.json({ ok: false, error: sumErr.message }, { status: 500 });
    }

    return NextResponse.json(
      { ok: true, pulse_id, summary: summaryRow },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
