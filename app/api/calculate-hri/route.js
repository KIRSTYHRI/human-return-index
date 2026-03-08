import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ORG_ID_FALLBACK = process.env.HRI_DEMO_ORG_ID || null;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toPctFrom1to5(value) {
  const n = toNumber(value);
  if (n == null) return null;
  return Math.round((n / 5) * 100);
}

function avg(values) {
  const nums = values.map(toNumber).filter((v) => v != null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((sum, v) => sum + v, 0) / nums.length) * 10) / 10;
}

function avgWhole(values) {
  const nums = values.map(toNumber).filter((v) => v != null);
  if (!nums.length) return null;
  return Math.round(nums.reduce((sum, v) => sum + v, 0) / nums.length);
}

function blendEqual(employeeValue, employerValue) {
  const e = toNumber(employeeValue);
  const m = toNumber(employerValue);

  if (e != null && m != null) return Math.round(((e + m) / 2) * 10) / 10;
  if (e != null) return e;
  if (m != null) return m;
  return null;
}

function badgeFromScore(score) {
  const n = toNumber(score);
  if (n == null) return null;
  if (n >= 80) return "HRI Accredited Plus";
  if (n >= 65) return "HRI Accredited";
  return "No Badge Yet";
}

export async function GET(request) {
  try {
    const supabase = getSupabase();

    const { searchParams } = new URL(request.url);
    const organisation_id =
      searchParams.get("organisation_id") ||
      searchParams.get("organization_id") ||
      ORG_ID_FALLBACK;

    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id" },
        { status: 400 }
      );
    }

    // -------------------------
    // 1) EMPLOYEE – latest pulse row
    // -------------------------
    const { data: latestPulse, error: pulseErr } = await supabase
      .from("pulse_check_submissions")
      .select(
        "id, organization_id, organisation_id, average_score, pillar_1_score, pillar_2_score, pillar_3_score, pillar_4_score, pillar_5_score, submitted_at"
      )
      .or(
        `organization_id.eq.${organisation_id},organisation_id.eq.${organisation_id}`
      )
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pulseErr) {
      return NextResponse.json(
        { ok: false, error: pulseErr.message },
        { status: 500 }
      );
    }

    const employee_pillar_1 = toPctFrom1to5(latestPulse?.pillar_1_score);
    const employee_pillar_2 = toPctFrom1to5(latestPulse?.pillar_2_score);
    const employee_pillar_3 = toPctFrom1to5(latestPulse?.pillar_3_score);
    const employee_pillar_4 = toPctFrom1to5(latestPulse?.pillar_4_score);
    const employee_pillar_5 = toPctFrom1to5(latestPulse?.pillar_5_score);

    const employee_score =
      latestPulse?.average_score != null
        ? toPctFrom1to5(latestPulse.average_score)
        : avgWhole([
            employee_pillar_1,
            employee_pillar_2,
            employee_pillar_3,
            employee_pillar_4,
            employee_pillar_5,
          ]);

    // -------------------------
    // 2) EMPLOYER – latest valid HRI assessment
    // -------------------------
    const { data: employerRows, error: employerErr } = await supabase
      .from("hri_assessments")
      .select("id, org_id, created_at, overall_score, pillar_scores")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (employerErr) {
      return NextResponse.json(
        { ok: false, error: employerErr.message },
        { status: 500 }
      );
    }

    const latestValidEmployer =
      (employerRows || []).find(
        (row) =>
          row?.overall_score != null &&
          row?.pillar_scores &&
          typeof row.pillar_scores === "object" &&
          Object.keys(row.pillar_scores).length > 0
      ) || null;

    const employer_score =
      latestValidEmployer?.overall_score != null
        ? toNumber(latestValidEmployer.overall_score)
        : null;

    const employer_pillar_1 =
      latestValidEmployer?.pillar_scores?.pillar_1 != null
        ? toNumber(latestValidEmployer.pillar_scores.pillar_1)
        : null;

    const employer_pillar_2 =
      latestValidEmployer?.pillar_scores?.pillar_2 != null
        ? toNumber(latestValidEmployer.pillar_scores.pillar_2)
        : null;

    const employer_pillar_3 =
      latestValidEmployer?.pillar_scores?.pillar_3 != null
        ? toNumber(latestValidEmployer.pillar_scores.pillar_3)
        : null;

    const employer_pillar_4 =
      latestValidEmployer?.pillar_scores?.pillar_4 != null
        ? toNumber(latestValidEmployer.pillar_scores.pillar_4)
        : null;

    const employer_pillar_5 =
      latestValidEmployer?.pillar_scores?.pillar_5 != null
        ? toNumber(latestValidEmployer.pillar_scores.pillar_5)
        : null;

    // -------------------------
    // 3) BLEND 50/50
    // -------------------------
    const pillar_1_hri = blendEqual(employee_pillar_1, employer_pillar_1);
    const pillar_2_hri = blendEqual(employee_pillar_2, employer_pillar_2);
    const pillar_3_hri = blendEqual(employee_pillar_3, employer_pillar_3);
    const pillar_4_hri = blendEqual(employee_pillar_4, employer_pillar_4);
    const pillar_5_hri = blendEqual(employee_pillar_5, employer_pillar_5);

    const hri_score =
      employee_score != null && employer_score != null
        ? Math.round(((employee_score + employer_score) / 2) * 10) / 10
        : avgWhole([
            pillar_1_hri,
            pillar_2_hri,
            pillar_3_hri,
            pillar_4_hri,
            pillar_5_hri,
          ]);

    const badge = badgeFromScore(hri_score);

    // -------------------------
    // 4) UPSERT INTO hri_scores
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

    const { data: existingRow, error: existingErr } = await supabase
      .from("hri_scores")
      .select("id, organisation_id")
      .eq("organisation_id", organisation_id)
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json(
        { ok: false, error: existingErr.message },
        { status: 500 }
      );
    }

    let writeResult = null;
    let writeErr = null;

    if (existingRow?.id) {
      const { data, error } = await supabase
        .from("hri_scores")
        .update(payload)
        .eq("id", existingRow.id)
        .select()
        .single();

      writeResult = data;
      writeErr = error;
    } else {
      const { data, error } = await supabase
        .from("hri_scores")
        .insert(payload)
        .select()
        .single();

      writeResult = data;
      writeErr = error;
    }

    if (writeErr) {
      return NextResponse.json(
        { ok: false, error: writeErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        organisation_id,
        employee_score,
        employer_score,
        hri_score,
        badge,
        score: writeResult,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to calculate HRI" },
      { status: 500 }
    );
  }
}
