import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  try {
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing env vars" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const organisation_id =
      body.organization_id || "9499b1b9-7fce-43a1-9590-d533f00dc71d";

    const answers = body.answers || {};

    // 🔑 map incoming answers → DB columns
    const row = {
      organization_id,

      q1_leadership_vision: answers.q1,
      q2_leadership_cares: answers.q2,
      q3_work_life_balance: answers.q3,
      q4_wellbeing_support: answers.q4,
      q5_valued_included: answers.q5,
      q6_treated_fairly: answers.q6,
      q7_growth_opportunities: answers.q7,
      q8_feedback_helps: answers.q8,
      q9_trust_colleagues: answers.q9,
      q10_clear_communication: answers.q10,
    };

    const { data, error } = await supabase
      .from("pulse_check_submissions")
      .insert(row)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 200 });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
