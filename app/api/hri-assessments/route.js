import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ORG_ID_FALLBACK = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  try {
    const supabase = getSupabase();
    const body = await req.json();

    const organization_id =
      body.organization_id ||
      body.org_id ||
      body.organisation_id ||
      ORG_ID_FALLBACK;

    // Map incoming answers safely
    const payload = {
      organization_id,
      employee_email: body.employee_email || null,

      q1_leadership_vision: body.q1 ?? null,
      q2_leadership_cares: body.q2 ?? null,
      q3_work_life_balance: body.q3 ?? null,
      q4_wellbeing_support: body.q4 ?? null,
      q5_valued_included: body.q5 ?? null,
      q6_treated_fairly: body.q6 ?? null,
      q7_growth_opportunities: body.q7 ?? null,
      q8_feedback_helps: body.q8 ?? null,
      q9_trust_colleagues: body.q9 ?? null,
      q10_clear_communication: body.q10 ?? null,

      total_score: body.total_score ?? null,
      average_score: body.average_score ?? null,

      pillar_1_score: body.pillar_1_score ?? null,
      pillar_2_score: body.pillar_2_score ?? null,
      pillar_3_score: body.pillar_3_score ?? null,
      pillar_4_score: body.pillar_4_score ?? null,
      pillar_5_score: body.pillar_5_score ?? null,
    };

    const { data, error } = await supabase
      .from("pulse_check_submissions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Pulse submission failed",
      },
      { status: 500 }
    );
  }
}
