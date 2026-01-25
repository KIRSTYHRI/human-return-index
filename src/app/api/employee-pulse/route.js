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

function clamp1to5(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  if (r < 1) return 1;
  if (r > 5) return 5;
  return r;
}

function calcSummary(valuesByPos) {
  const v = (p) => Number(valuesByPos[p] ?? 0);

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

export async function POST(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  try {
    const body = await req.json();

    const organisation_id =
      body?.organisation_id || body?.organization_id || body?.org_id || null;

    const employee_email = body?.employee_email || null;

    // Accept either:
    // - responses: [ {question_id, response_value}, ... ]  (preferred)
    // - responses: { q1: 5, q2: 4, ... }                  (legacy)
    let responses = [];
    if (Array.isArray(body?.responses)) {
      responses = body.responses;
    } else if (body?.responses && typeof body.responses === "object") {
      // legacy object -> convert to array with no question_id (we’ll fail nicely)
      responses = Object.entries(body.responses).map(([k, v]) => ({
        question_key: k,
        response_value: v,
      }));
    }

    if (!organisation_id) {
      return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
    }
    if (!looksLikeUuid(String(organisation_id))) {
      return NextResponse.json(
        { ok: false, error: "organisation_id must be a valid UUID" },
        { status: 400 }
      );
    }
    if (responses.length !== 10) {
      return NextResponse.json(
        { ok: false, error: `Expected 10 responses, got ${responses.length}` },
        { status: 400 }
      );
    }

    // We REQUIRE question_id for the array version (your curl uses this)
    const ids = responses.map((r) => r.question_id).filter(Boolean);
    if (ids.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Each response must include question_id" },
        { status: 400 }
      );
    }

    const { data: qRows, error: qErr } = await supabase
      .from("hri_pulse_questions")
      .select("id, position")
      .in("id", ids);

    if (qErr) {
      return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
    }

    const posById = Object.fromEntries((qRows || []).map((q) => [q.id, Number(q.position)]));

    const valuesByPos = {};
    for (const r of responses) {
      const pos = posById[r.question_id]; // now guaranteed number
      if (pos >= 1 && pos <= 10) valuesByPos[pos] = clamp1to5(r.response_value);
    }

    // Ensure we don’t write 0s by accident if something goes missing
    for (let p = 1; p <= 10; p++) {
      if (valuesByPos[p] == null) {
        return NextResponse.json(
          { ok: false, error: `Missing/invalid response for position ${p}` },
          { status: 400 }
        );
      }
    }

    const summary = calcSummary(valuesByPos);

    const submissionPayload = {
      organization_id: String(organisation_id),
      organisation_id: String(organisation_id),
      employee_email,
      submitted_at: new Date().toISOString(),
      ...summary,
    };

    // IMPORTANT: do NOT Number(null) => 0
    for (const [posStr, col] of Object.entries(POS_TO_COL)) {
      const pos = Number(posStr);
      submissionPayload[col] = valuesByPos[pos]; // already 1..5
    }

    const { data: submission, error: subErr } = await supabase
      .from("pulse_check_submissions")
      .insert(submissionPayload)
      .select("*")
      .single();

    if (subErr) {
      return NextResponse.json({ ok: false, error: subErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: submission }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
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
