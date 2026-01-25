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

// clamp any junk to an integer 1..5 OR null
function clamp15(input) {
  if (input === null || input === undefined || input === "") return null;
  const n = Number(input);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1) return 1;
  if (rounded > 5) return 5;
  return rounded;
}

function calcSummary(valuesByPos) {
  const v = (p) => Number(valuesByPos[p] ?? 0);

  const total = Object.keys(POS_TO_COL).reduce((sum, p) => sum + v(Number(p)), 0);
  const avg = total / 10;

  return {
    total_score: total,
    average_score: avg,
    pillar_1_score: (v(1) + v(2)) / 2, // Leadership
    pillar_2_score: (v(3) + v(4)) / 2, // Wellbeing & MH
    pillar_3_score: (v(5) + v(6)) / 2, // Inclusion
    pillar_4_score: (v(7) + v(8)) / 2, // Growth
    pillar_5_score: (v(9) + v(10)) / 2, // Trust & Comms
  };
}

export async function POST(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  try {
    const body = await req.json();

    // 🔥 marker so you can prove you're hitting this file
    const ROUTE_VERSION = "EMPLOYEE_PULSE_ROUTE_2026-01-25_17:45_CLAMPED";

    const organisation_id =
      body?.organisation_id ||
      body?.organization_id ||
      body?.org_id ||
      null;

    const employee_email = body?.employee_email || null;
    const rawResponses = body?.responses ?? null;

    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id", route: ROUTE_VERSION },
        { status: 400 }
      );
    }
    if (!looksLikeUuid(String(organisation_id))) {
      return NextResponse.json(
        { ok: false, error: "organisation_id must be a valid UUID", route: ROUTE_VERSION },
        { status: 400 }
      );
    }

    // Build valuesByPos {1..10} from either payload format
    const valuesByPos = {};

    // Format A: responses is an OBJECT: { q1: 5, ..., q10: 4 }
    if (rawResponses && !Array.isArray(rawResponses) && typeof rawResponses === "object") {
      for (let p = 1; p <= 10; p++) {
        const key = `q${p}`;
        valuesByPos[p] = clamp15(rawResponses[key]);
      }
    }

    // Format B: responses is an ARRAY: [{question_id, response_value}, ...]
    if (Array.isArray(rawResponses)) {
      if (rawResponses.length !== 10) {
        return NextResponse.json(
          { ok: false, error: `Expected 10 responses, got ${rawResponses.length}`, route: ROUTE_VERSION },
          { status: 400 }
        );
      }

      const ids = rawResponses.map((r) => r.question_id).filter(Boolean);

      const { data: qRows, error: qErr } = await supabase
        .from("hri_pulse_questions")
        .select("id, position")
        .in("id", ids);

      if (qErr) {
        return NextResponse.json({ ok: false, error: qErr.message, route: ROUTE_VERSION }, { status: 500 });
      }

      const posById = Object.fromEntries((qRows || []).map((q) => [q.id, q.position]));

      for (const r of rawResponses) {
        const pos = posById[r.question_id];
        if (pos) valuesByPos[pos] = clamp15(r.response_value);
      }
    }

    // Safety: ensure we have all 1..10 keys. Missing becomes null (NOT 0)
    for (let p = 1; p <= 10; p++) {
      if (!(p in valuesByPos)) valuesByPos[p] = null;
    }

    // IMPORTANT: DB constraint is 1..5 OR NULL. If anything is still out of range, clamp it.
    for (let p = 1; p <= 10; p++) {
      valuesByPos[p] = clamp15(valuesByPos[p]);
    }

    // If any are null, we can still write, but your totals will treat null as 0.
    // If you want to *reject* missing answers, uncomment below:
    /*
    const missing = Object.entries(valuesByPos).filter(([_, v]) => v === null);
    if (missing.length) {
      return NextResponse.json({ ok:false, error:"Missing one or more response values", missing, route: ROUTE_VERSION }, { status: 400 });
    }
    */

    const summary = calcSummary(valuesByPos);

    const submissionPayload = {
      organization_id: String(organisation_id), // backwards compatible text
      organisation_id: String(organisation_id), // uuid
      employee_email,
      submitted_at: new Date().toISOString(),
      ...summary,
    };

    // Write q1..q10 as either 1..5 or NULL (never 0)
    for (const [posStr, col] of Object.entries(POS_TO_COL)) {
      const pos = Number(posStr);
      submissionPayload[col] = valuesByPos[pos] === null ? null : Number(valuesByPos[pos]);
    }

    const { data: submission, error: subErr } = await supabase
      .from("pulse_check_submissions")
      .insert(submissionPayload)
      .select("*")
      .single();

    if (subErr) {
      return NextResponse.json(
        { ok: false, error: subErr.message, route: ROUTE_VERSION, debug: submissionPayload },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, route: ROUTE_VERSION, submission },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error", route: "EMPLOYEE_PULSE_ROUTE_FAILSAFE" },
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
