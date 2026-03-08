import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "EMPLOYEE_PULSE__V4__REAL_COLUMNS";

export async function POST(req) {
  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  const { supabase, user } = await getAuthUser(req);
  const body = await req.json();
  const answers = body?.answers || [];

  if (!answers.length) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "No answers provided." },
      { status: 400 }
    );
  }

  let organisation_id = null;

  if (user?.organisation_id) {
    organisation_id = user.organisation_id;
  }

  if (!organisation_id && demoOrgId) {
    organisation_id = demoOrgId;
  }

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

  if (!supabase) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Supabase not available." },
      { status: 500 }
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

  const pillar_1_score = (values[0] + values[1]) / 2; // Leadership
  const pillar_2_score = (values[2] + values[3]) / 2; // Wellbeing
  const pillar_3_score = (values[4] + values[5]) / 2; // Inclusion
  const pillar_4_score = (values[6] + values[7]) / 2; // Growth
  const pillar_5_score = (values[8] + values[9]) / 2; // Trust

  const submission = {
    organisation_id,
    organization_id: String(organisation_id), // keep for compatibility with your existing rows
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

  const { error } = await supabase
    .from("pulse_check_submissions")
    .insert(submission);

  if (error) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: VERSION,
    demo: !user,
    message: "Pulse submitted successfully.",
  });
}
