import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "EMPLOYEE_PULSE__AUTO_HRI_V3__SAFE_CALC";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readJsonSafe(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`calculate-hri returned non-JSON: ${text.slice(0, 120)}`);
  }
}

export async function POST(req) {
  try {
    const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;
    const { user } = await getAuthUser(req);
    const supabase = getServiceSupabase();

    const body = await req.json();
    const answers = body?.answers || [];

    if (!answers.length) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No answers provided." },
        { status: 400 }
      );
    }

    const organisation_id = body?.organisation_id || demoOrgId || null;

    if (!organisation_id) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "Missing organisation_id (and no HRI_DEMO_ORG_ID set).",
        },
        { status: 400 }
      );
    }

    if (answers.length !== 10) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Expected 10 answers." },
        { status: 400 }
      );
    }

    const values = answers.map((a) => Number(a.value));
    const total_score = values.reduce((sum, v) => sum + v, 0);
    const average_score = total_score / 10;

    const pillar_1_score = (values[0] + values[1]) / 2;
    const pillar_2_score = (values[2] + values[3]) / 2;
    const pillar_3_score = (values[4] + values[5]) / 2;
    const pillar_4_score = (values[6] + values[7]) / 2;
    const pillar_5_score = (values[8] + values[9]) / 2;

    const submission = {
      organisation_id,
      organization_id: String(organisation_id),
      employee_email: body?.employee_email || null,
      q1_leadership_vision: values[0],
      q2_leadership_cares: values[1],
      q3_work_life_balance: values[2],
      q4_wellbeing_support: values[3],
      q5_valued_included: values[4],
      q6_treated_fairly: values[5],
      q7_growth_opportunities: values[6],
      q8_feedback_helps: values[7],
      q9_trust_colleagues: values[8],
      q10_clear_communication: values[9],
      total_score,
      average_score,
      pillar_1_score,
      pillar_2_score,
      pillar_3_score,
      pillar_4_score,
      pillar_5_score,
      submitted_at: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase
      .from("pulse_check_submissions")
      .insert(submission);

    if (insertErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: insertErr.message },
        { status: 500 }
      );
    }

    const origin = new URL(req.url).origin;
    const calcUrl = new URL("/api/calculate-hri", origin);
    calcUrl.searchParams.set("organisation_id", organisation_id);

    const calcRes = await fetch(calcUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const calcJson = await readJsonSafe(calcRes);

    if (!calcRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: calcJson?.error || "Pulse saved, but HRI recalculation failed.",
          calculate_hri: calcJson,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      demo: !user && !!demoOrgId,
      organisation_id,
      message: "Pulse submitted successfully.",
      calculate_hri: calcJson,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: err?.message || "Pulse submission failed" },
      { status: 500 }
    );
  }
}
