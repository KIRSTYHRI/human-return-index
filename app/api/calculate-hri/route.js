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
  if (row?.response_value != null) return Number(row.response_value);

  const t = String(row?.response_text || "").trim().toLowerCase();
  if (!t) return null;

  if (EMPLOYER_TEXT_TO_NUM[t] != null) return EMPLOYER_TEXT_TO_NUM[t];

  const asNum = Number(t);
  if (asNum >= 1 && asNum <= 5) return asNum;

  return null;
}

function avg(nums) {
  const clean = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!clean.length) return null;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

// Convert 1–5 to 0–100
function toPctFrom1to5(score1to5) {
  if (score1to5 == null) return null;
  return Number(score1to5) * 20;
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
    // 1) EMPLOYEE (Pulse) – latest row from pulse_check_submissions ✅
    // -------------------------
    const { data: latestPulse, error: pulseErr } = await supabase
      .from("pulse_check_submissions")
      .select(
        "id, organization_id, average_score, pillar_1_score, pillar_2_score, pillar_3_score, pillar_4_score, pillar_5_score, submitted_at"
      )
      .eq("organization_id", String(organisation_id))
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pulseErr) {
      return NextResponse.json({ ok: false, error: pulseErr.message }, { status: 500 });
    }

    // Employee scores (0–100)
    const employee_pillar_1 = toPctFrom1to5(latestPulse?.pillar_1_score);
    const employee_pillar_2 = toPctFrom1to5(latestPulse?.pillar_2_score);
    const employee_pillar_3 = toPctFrom1to5(latestPulse?.pillar_3_score);
    const employee_pillar_4 = toPctFrom1to5(latestPulse?.pillar_4_score);
    const employee_pillar_5 = toPctFrom1to5(latestPulse?.pillar_5_score);

    // Use average_score (1–5) → score out of 100
    const employee_score = latestPulse?.average_score != null
      ? toPctFrom1to5(latestPulse.average_score)
      : avg([
          employee_pillar_1,
          employee_pillar_2,
          employee_pillar_3,
          employee_pillar_4,
          employee_pillar_5,
        ]);

        // -------------------------
    // 2) EMPLOYER – latest HRI assessment -> pillar scores (0–100)
    // -------------------------
    const { data: latestAssessment, error: aErr } = await supabase
      .from("hri_assessments")
      .select("id, org_id, created_at, overall_score, pillar_scores")
      .eq("org_id", organisation_id)
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

    if (latestAssessment) {
      employer_score =
        latestAssessment?.overall_score != null
          ? Number(latestAssessment.overall_score)
          : null;

      employer_pillar_1 =
        latestAssessment?.pillar_scores?.pillar_1 != null
          ? Number(latestAssessment.pillar_scores.pillar_1)
          : null;

      employer_pillar_2 =
        latestAssessment?.pillar_scores?.pillar_2 != null
          ? Number(latestAssessment.pillar_scores.pillar_2)
          : null;

      employer_pillar_3 =
        latestAssessment?.pillar_scores?.pillar_3 != null
          ? Number(latestAssessment.pillar_scores.pillar_3)
          : null;

      employer_pillar_4 =
        latestAssessment?.pillar_scores?.pillar_4 != null
          ? Number(latestAssessment.pillar_scores.pillar_4)
          : null;

      employer_pillar_5 =
        latestAssessment?.pillar_scores?.pillar_5 != null
          ? Number(latestAssessment.pillar_scores.pillar_5)
          : null;
    }

    // -------------------------
    // 3) FINAL 50/50 HRI SCORE ✅
    // -------------------------
    const WEIGHT_EMPLOYER = 0.5;
    const WEIGHT_EMPLOYEE = 0.5;

    let hri_score = null;
    if (employer_score != null && employee_score != null) {
      hri_score = employer_score * WEIGHT_EMPLOYER + employee_score * WEIGHT_EMPLOYEE;
    } else if (employer_score != null) {
      hri_score = employer_score;
    } else if (employee_score != null) {
      hri_score = employee_score;
    }

    const badge = badgeFromHri(hri_score);

    // -------------------------
    // 4) UPSERT into hri_scores (your table uses organisation_id + updated_at)
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
