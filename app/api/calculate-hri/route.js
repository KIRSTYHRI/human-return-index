import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "CALCULATE_HRI__V5__RECALC_EMPLOYER_OVERALL";
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

function normalizeEmployerAssessment(row) {
  if (!row) return null;

  const raw = row.pillar_scores;

  let pillar_1 = null;
  let pillar_2 = null;
  let pillar_3 = null;
  let pillar_4 = null;
  let pillar_5 = null;

  // OLD FORMAT: object { pillar_1, pillar_2, ... }
  if (raw && !Array.isArray(raw) && typeof raw === "object") {
    pillar_1 = toNumber(raw.pillar_1);
    pillar_2 = toNumber(raw.pillar_2);
    pillar_3 = toNumber(raw.pillar_3);
    pillar_4 = toNumber(raw.pillar_4);
    pillar_5 = toNumber(raw.pillar_5);
  }

  // NEW FORMAT: array [{ pillar, score }]
  if (Array.isArray(raw)) {
    const byName = Object.fromEntries(
      raw.map((item) => [String(item?.pillar || "").trim().toLowerCase(), toNumber(item?.score)])
    );

    pillar_1 =
      byName["leadership"] ??
      byName["human-centred leadership"] ??
      pillar_1;

    pillar_2 =
      byName["wellbeing & mental health"] ??
      byName["wellbeing and mental health"] ??
      pillar_2;

    pillar_3 =
      byName["inclusion & belonging"] ??
      byName["inclusion and belonging"] ??
      byName["inclusion, safety & belonging"] ??
      byName["inclusion, safety and belonging"] ??
      pillar_3;

    pillar_4 =
      byName["growth & development"] ??
      byName["growth and development"] ??
      byName["growth, learning & performance"] ??
      byName["growth, learning and performance"] ??
      pillar_4;

    pillar_5 =
      byName["trust & communication"] ??
      byName["trust and communication"] ??
      byName["trust, communication & clarity"] ??
      byName["trust, communication and clarity"] ??
      pillar_5;
  }

  if ([pillar_1, pillar_2, pillar_3, pillar_4, pillar_5].every((v) => v == null)) {
    return null;
  }

  const calculatedOverall = avgWhole([pillar_1, pillar_2, pillar_3, pillar_4, pillar_5]);
  const rawOverall = toNumber(row.overall_score);

  // IMPORTANT:
  // If raw overall is null, 0, or invalid, trust the pillar average instead.
  const overall_score =
    rawOverall != null && rawOverall > 0 ? rawOverall : calculatedOverall;

  return {
    overall_score,
    employer_pillar_1: pillar_1,
    employer_pillar_2: pillar_2,
    employer_pillar_3: pillar_3,
    employer_pillar_4: pillar_4,
    employer_pillar_5: pillar_5,
  };
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
        { ok: false, version: VERSION, error: "Missing organisation_id" },
        { status: 400 }
      );
    }

    const { data: latestPulse, error: pulseErr } = await supabase
      .from("pulse_check_submissions")
      .select(
        "id, organization_id, organisation_id, average_score, pillar_1_score, pillar_2_score, pillar_3_score, pillar_4_score, pillar_5_score, submitted_at"
      )
      .or(`organization_id.eq.${organisation_id},organisation_id.eq.${organisation_id}`)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pulseErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: pulseErr.message },
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

    const { data: employerRows, error: employerErr } = await supabase
      .from("hri_assessments")
      .select("id, org_id, created_at, overall_score, pillar_scores")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (employerErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: employerErr.message },
        { status: 500 }
      );
    }

    const latestValidEmployerRow =
      (employerRows || []).find((row) => normalizeEmployerAssessment(row)) || null;

    const normalizedEmployer = normalizeEmployerAssessment(latestValidEmployerRow);

    const employer_score = normalizedEmployer?.overall_score ?? null;
    const employer_pillar_1 = normalizedEmployer?.employer_pillar_1 ?? null;
    const employer_pillar_2 = normalizedEmployer?.employer_pillar_2 ?? null;
    const employer_pillar_3 = normalizedEmployer?.employer_pillar_3 ?? null;
    const employer_pillar_4 = normalizedEmployer?.employer_pillar_4 ?? null;
    const employer_pillar_5 = normalizedEmployer?.employer_pillar_5 ?? null;

    const hri_score =
      employee_score != null && employer_score != null
        ? Math.round(((employee_score + employer_score) / 2) * 10) / 10
        : avgWhole([
            blendEqual(employee_pillar_1, employer_pillar_1),
            blendEqual(employee_pillar_2, employer_pillar_2),
            blendEqual(employee_pillar_3, employer_pillar_3),
            blendEqual(employee_pillar_4, employer_pillar_4),
            blendEqual(employee_pillar_5, employer_pillar_5),
          ]);

    const badge = badgeFromScore(hri_score);
    const nowIso = new Date().toISOString();

    const snapshotPayload = {
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
      updated_at: nowIso,
    };

    const { data: existingRow, error: existingErr } = await supabase
      .from("hri_scores")
      .select("id, organisation_id")
      .eq("organisation_id", organisation_id)
      .limit(1)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: existingErr.message },
        { status: 500 }
      );
    }

    let saved = null;
    let saveErr = null;

    if (existingRow?.id) {
      const { data, error } = await supabase
        .from("hri_scores")
        .update(snapshotPayload)
        .eq("id", existingRow.id)
        .select()
        .single();
      saved = data;
      saveErr = error;
    } else {
      const { data, error } = await supabase
        .from("hri_scores")
        .insert(snapshotPayload)
        .select()
        .single();
      saved = data;
      saveErr = error;
    }

    if (saveErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: saveErr.message },
        { status: 500 }
      );
    }

    await supabase.from("hri_score_history").insert({
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
      source: "calculate-hri",
    });

    return NextResponse.json(
      {
        ok: true,
        version: VERSION,
        organisation_id,
        employer_score,
        employee_score,
        hri_score,
        badge,
        saved,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: err?.message || "Failed to calculate HRI",
      },
      { status: 500 }
    );
  }
}
