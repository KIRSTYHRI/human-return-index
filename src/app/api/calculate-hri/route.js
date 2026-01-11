import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ORG_ID_FALLBACK = "9499b1b9-7fce-43a1-9590-d533f00dc71d"; // your org uuid

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Employer assessment mapping: Never/Rarely/Sometimes/Often/Always -> 1..5
const EMPLOYER_TEXT_TO_NUM = {
  never: 1,
  rarely: 2,
  sometimes: 3,
  often: 4,
  always: 5,
};

function toEmployerNumber(row) {
  // Prefer numeric if you already store it
  if (row?.response_value != null) return Number(row.response_value);

  const t = String(row?.response_text || "").trim().toLowerCase();
  if (!t) return null;

  // allow a few variants
  if (EMPLOYER_TEXT_TO_NUM[t] != null) return EMPLOYER_TEXT_TO_NUM[t];

  // if you stored "1".."5" as text
  const asNum = Number(t);
  if (asNum >= 1 && asNum <= 5) return asNum;

  return null;
}

function avg(nums) {
  const clean = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!clean.length) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

function toPctFrom1to5(score1to5) {
  if (score1to5 == null) return null;
  return (Number(score1to5) / 5) * 100;
}

function badgeFromHri(hri) {
  if (hri == null) return "No Badge Yet";
  if (hri >= 75) return "HRI Accredited Plus";
  if (hri >= 60) return "HRI Accredited";
  return "HRI Certified";
}

// GET: calculate + upsert into hri_scores (easy to test in browser)
export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing env vars (check Vercel env + redeploy)" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const organisation_id = searchParams.get("organisation_id") || ORG_ID_FALLBACK;

    // -------------------------
    // 1) EMPLOYEE (Pulse) – latest row from employee_pulse_responses
    // -------------------------
    const { data: latestPulse, error: pulseErr } = await supabase
  .from("employee_pulse_responses")
  .select(
    "id, organisation_id, average_score, pillar_1_score, pillar_2_score, pillar_3_score, pillar_4_score, pillar_5_score, submitted_at"
  )
  .eq("organisation_id", String(organisation_id))
  .order("submitted_at", { ascending: false })
  .limit(1)
  .maybeSingle();


    if (pulseErr) {
      return NextResponse.json({ ok: false, error: pulseErr.message }, { status: 500 });
    }

    // Convert employee pillar scores to 0-100
    const employee_pillar_1 = toPctFrom1to5(latestPulse?.pillar_1_score);
    const employee_pillar_2 = toPctFrom1to5(latestPulse?.pillar_2_score);
    const employee_pillar_3 = toPctFrom1to5(latestPulse?.pillar_3_score);
    const employee_pillar_4 = toPctFrom1to5(latestPulse?.pillar_4_score);
    const employee_pillar_5 = toPctFrom1to5(latestPulse?.pillar_5_score);

    const employee_score = avg([
      employee_pillar_1,
      employee_pillar_2,
      employee_pillar_3,
      employee_pillar_4,
      employee_pillar_5,
    ]);

    // -------------------------
    // 2) EMPLOYER – latest assessment’s responses -> pillar scores
    // We calculate using employer_assessment_responses joined to employer_questions
    // -------------------------
    // Find latest assessment id for org (if your assessments table uses organisation_id)
    const { data: latestAssessment, error: aErr } = await supabase
      .from("assessments")
      .select("id, organisation_id, created_at")
      .eq("organisation_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) {
      return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });
    }

    let employer_pillar_1 = null;
    let employer_pillar_2 = null;
    let employer_pillar_3 = null;
    let employer_pillar_4 = null;
    let employer_pillar_5 = null;
    let employer_score = null;

    if (latestAssessment?.id) {
      const assessment_id = latestAssessment.id;

      const { data: respRows, error: rErr } = await supabase
        .from("employer_assessment_responses")
        .select("response_text, response_value, question_id")
        .eq("assessment_id", assessment_id);

      if (rErr) {
        return NextResponse.json({ ok: false, error: rErr.message }, { status: 500 });
      }

      const qIds = (respRows || []).map((r) => r.question_id).filter(Boolean);

      const { data: qRows, error: qErr } = await supabase
        .from("employer_questions")
        .select("id, pillar, sort_order, position, code")
        .in("id", qIds);

      if (qErr) {
        return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
      }

      const pillarByQid = Object.fromEntries((qRows || []).map((q) => [q.id, q.pillar]));

      // Group by pillar text
      const buckets = {
        p1: [],
        p2: [],
        p3: [],
        p4: [],
        p5: [],
      };

      for (const r of respRows || []) {
        const pillar = String(pillarByQid[r.question_id] || "").toLowerCase();
        const n = toEmployerNumber(r);
        if (n == null) continue;

        // Map pillar names to p1..p5 (match your question bank wording)
        if (pillar.includes("leadership")) buckets.p1.push(n);
        else if (pillar.includes("wellbeing")) buckets.p2.push(n);
        else if (pillar.includes("inclusion") || pillar.includes("belonging") || pillar.includes("safety"))
          buckets.p3.push(n);
        else if (pillar.includes("growth") || pillar.includes("learning") || pillar.includes("performance"))
          buckets.p4.push(n);
        else if (pillar.includes("trust") || pillar.includes("communication") || pillar.includes("clarity"))
          buckets.p5.push(n);
      }

      employer_pillar_1 = toPctFrom1to5(avg(buckets.p1));
      employer_pillar_2 = toPctFrom1to5(avg(buckets.p2));
      employer_pillar_3 = toPctFrom1to5(avg(buckets.p3));
      employer_pillar_4 = toPctFrom1to5(avg(buckets.p4));
      employer_pillar_5 = toPctFrom1to5(avg(buckets.p5));

      employer_score = avg([
        employer_pillar_1,
        employer_pillar_2,
        employer_pillar_3,
        employer_pillar_4,
        employer_pillar_5,
      ]);
    }

    // -------------------------
    // 3) FINAL 50/50 HRI SCORE
    // If one side is missing, we still store what we have (MVP-friendly)
    // -------------------------
    let hri_score = null;

    if (employer_score != null && employee_score != null) {
      hri_score = employer_score * 0.5 + employee_score * 0.5;
    } else if (employer_score != null) {
      hri_score = employer_score; // until pulse exists
    } else if (employee_score != null) {
      hri_score = employee_score; // until employer exists
    }

    const badge = badgeFromHri(hri_score);

    // -------------------------
    // 4) UPSERT into hri_scores
    // -------------------------
    const payload = {
      organisation_id,
      employer_score,
      employee_score,
      hri_score,
      employer_pillar_1,
      employer_pillar_2,
      employer_pillar_3,
      employer_pillar_4,
      employer_pillar_5,
      employee_pillar_1,
      employee_pillar_2,
      employee_pillar_3,
      employee_pillar_4,
      employee_pillar_5,
      badge,
      updated_at: new Date().toISOString(),
    };

    // Try update first (if row exists), else insert
    const { data: existing, error: exErr } = await supabase
      .from("hri_scores")
      .select("id")
      .eq("organisation_id", organisation_id)
      .limit(1)
      .maybeSingle();

    if (exErr) {
      return NextResponse.json({ ok: false, error: exErr.message }, { status: 500 });
    }

    let saved = null;

    if (existing?.id) {
      const { data, error } = await supabase
        .from("hri_scores")
        .update(payload)
        .eq("id", existing.id)
        .select("*")
        .single();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      saved = data;
    } else {
      const { data, error } = await supabase
        .from("hri_scores")
        .insert(payload)
        .select("*")
        .single();

      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      saved = data;
    }

    return NextResponse.json(
      {
        ok: true,
        organisation_id,
        calculated: {
          employer_score,
          employee_score,
          hri_score,
          badge,
        },
        saved,
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
