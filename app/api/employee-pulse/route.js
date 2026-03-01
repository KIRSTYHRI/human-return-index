import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "EMPLOYEE_PULSE__V2__DEMO_OK";

function avg(arr) {
  const nums = arr.filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function groupByPillar(answers = []) {
  // answers: [{ id, value, pillar? }]
  // if pillar not provided, infer from id prefix conventions:
  // p_wmh_, p_lead_, p_tc_, p_gd_, p_ib_
  const buckets = {
    pillar_1: [], // Growth & Development
    pillar_2: [], // Leadership
    pillar_3: [], // Trust & Communication
    pillar_4: [], // Wellbeing & Mental Health
    pillar_5: [], // Inclusion & Belonging
  };

  for (const a of answers) {
    const v = Number(a?.value);
    if (!Number.isFinite(v)) continue;

    const id = String(a?.id || "");
    const p = String(a?.pillar || "");

    const key =
      p.includes("GROWTH") || id.startsWith("p_gd_") ? "pillar_1"
      : p.includes("LEAD") || id.startsWith("p_lead_") ? "pillar_2"
      : p.includes("TRUST") || id.startsWith("p_tc_") ? "pillar_3"
      : p.includes("WELLBEING") || id.startsWith("p_wmh_") ? "pillar_4"
      : p.includes("INCLUSION") || id.startsWith("p_ib_") ? "pillar_5"
      : null;

    if (key) buckets[key].push(v);
  }

  return {
    pillar_1_score: avg(buckets.pillar_1),
    pillar_2_score: avg(buckets.pillar_2),
    pillar_3_score: avg(buckets.pillar_3),
    pillar_4_score: avg(buckets.pillar_4),
    pillar_5_score: avg(buckets.pillar_5),
  };
}

export async function POST(req) {
  const method = "POST";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Missing Supabase env vars", method },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  // Auth (Bearer) if present
  const { user, error: authError } = await getAuthUser(req);

  // ✅ Allow demo mode (no user) if demo org exists
  if (!user && !demoOrgId) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: authError || "Auth session missing!", method },
      { status: 401 }
    );
  }

  let body = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const organisation_id = body?.organisation_id || demoOrgId || null;

  // payload can be either:
  // { answers: [{id,value,pillar?}, ...] }
  // or { responses: [{question_id, value}, ...] } etc
  const rawAnswers =
    body?.answers ||
    body?.responses ||
    body?.payloadAnswers ||
    [];

  const answers = Array.isArray(rawAnswers) ? rawAnswers : [];

  if (!organisation_id) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Missing organisation_id (and no HRI_DEMO_ORG_ID set).", method },
      { status: 400 }
    );
  }

  if (!answers.length) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "No answers provided.", method },
      { status: 400 }
    );
  }

  const pillarScores = groupByPillar(answers);
  const average_score = avg([
    pillarScores.pillar_1_score,
    pillarScores.pillar_2_score,
    pillarScores.pillar_3_score,
    pillarScores.pillar_4_score,
    pillarScores.pillar_5_score,
  ]);

  // ✅ Insert submission
  // Table from your grep: pulse_check_submissions
  // Columns assumed: organisation_id, user_id, answers_json, pillar_1_score..pillar_5_score, average_score, created_at
  const insertPayload = {
    organisation_id,
    user_id: user?.id || null, // demo mode => null
    answers_json: answers,       // store raw answers
    ...pillarScores,
    average_score,
  };

  const { data, error } = await supabase
    .from("pulse_check_submissions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: error.message, method },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: VERSION,
    demo: !user,
    organisation_id,
    pulse_id: data?.id || null,
    average_score,
  });
}
