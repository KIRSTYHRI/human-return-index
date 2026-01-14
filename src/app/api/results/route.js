import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function serviceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function badRequest(message, extra = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status: 400 });
}

function serverError(message, extra = {}) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status: 500 });
}

// 1..5 -> 0..100
function likertToScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, ((n - 1) / 4) * 100));
}

function round1(n) {
  if (n === null || n === undefined) return null;
  return Math.round(n * 10) / 10;
}

// Map pillar names safely to a standard key
function normalisePillarKey(name) {
  const s = String(name || "").toLowerCase();
  if (s.includes("wellbeing")) return "wellbeing";
  if (s.includes("growth")) return "growth";
  if (s.includes("inclusion") || s.includes("belong")) return "inclusion";
  if (s.includes("trust") || s.includes("commun")) return "trust";
  if (s.includes("leader")) return "leadership";
  return "other";
}

function bandFromScore(score) {
  if (score === null || score === undefined) return "unknown";
  if (score >= 80) return "excellent";
  if (score >= 65) return "strong";
  if (score >= 50) return "steady";
  if (score >= 35) return "at_risk";
  return "critical";
}

async function getOrgFromCookie(request, supabase) {
  // If you ever pass ?org_id=... we’ll accept it (useful for debugging)
  const url = new URL(request.url);
  const qsOrg = url.searchParams.get("org_id");
  if (qsOrg) return qsOrg;

  // Otherwise try to infer from session cookie by calling your existing /api/me/org route (client-side does this)
  // But server-side we don’t have the user session via service role. So we require org_id passed OR
  // you wire the dashboard to call /api/me/org first and then call /api/results?org_id=...
  return null;
}

async function computeEmployer(supabase, organisation_id) {
  // Grab latest employer assessment submission rows (assumes employer_assessment_responses has created_at)
  const { data: rows, error } = await supabase
    .from("employer_assessment_responses")
    .select("pillar, response_value, created_at")
    .eq("organisation_id", organisation_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) return { score: null, pillars: {}, missing: true };

  // Use latest timestamp group as “latest assessment”
  const latestTs = rows[0]?.created_at;
  const latest = rows.filter((r) => r.created_at === latestTs);

  const byPillar = {};
  for (const r of latest) {
    const key = normalisePillarKey(r.pillar);
    const s = likertToScore(r.response_value);
    if (s === null) continue;
    if (!byPillar[key]) byPillar[key] = [];
    byPillar[key].push(s);
  }

  const pillarScores = {};
  const all = [];
  for (const k of Object.keys(byPillar)) {
    const arr = byPillar[k];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    pillarScores[k] = round1(avg);
    all.push(...arr);
  }

  const overall = all.length ? round1(all.reduce((a, b) => a + b, 0) / all.length) : null;
  return { score: overall, pillars: pillarScores, missing: overall === null };
}

async function computeEmployee(supabase, organisation_id) {
  // We support two patterns:
  // A) employee_pulse_responses exists (single table with created_at)
  // B) pulse_check_submissions + employee_pulse_responses linked by submission_id
  // We’ll try B first, then fallback to A.

  // Try B: aggregate latest submission set
  const { data: subs, error: subErr } = await supabase
    .from("pulse_check_submissions")
    .select("id, created_at")
    .eq("organisation_id", organisation_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!subErr && subs && subs.length) {
    const submission_id = subs[0].id;
    const { data: rows, error } = await supabase
      .from("employee_pulse_responses")
      .select("pillar, response_value")
      .eq("organisation_id", organisation_id)
      .eq("submission_id", submission_id);

    if (error) throw error;
    return aggregateEmployeeRows(rows);
  }

  // Fallback A: just pull latest by created_at if present
  const { data: rowsA, error: errA } = await supabase
    .from("employee_pulse_responses")
    .select("pillar, response_value, created_at")
    .eq("organisation_id", organisation_id)
    .order("created_at", { ascending: false });

  if (errA) throw errA;
  if (!rowsA || rowsA.length === 0) return { score: null, pillars: {}, missing: true };

  const latestTs = rowsA[0]?.created_at;
  const latest = latestTs ? rowsA.filter((r) => r.created_at === latestTs) : rowsA;
  return aggregateEmployeeRows(latest);
}

function aggregateEmployeeRows(rows) {
  if (!rows || rows.length === 0) return { score: null, pillars: {}, missing: true };

  const byPillar = {};
  for (const r of rows) {
    const key = normalisePillarKey(r.pillar);
    const s = likertToScore(r.response_value);
    if (s === null) continue;
    if (!byPillar[key]) byPillar[key] = [];
    byPillar[key].push(s);
  }

  const pillarScores = {};
  const all = [];
  for (const k of Object.keys(byPillar)) {
    const arr = byPillar[k];
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    pillarScores[k] = round1(avg);
    all.push(...arr);
  }

  const overall = all.length ? round1(all.reduce((a, b) => a + b, 0) / all.length) : null;
  return { score: overall, pillars: pillarScores, missing: overall === null };
}

export async function GET(request) {
  const supabase = serviceSupabase();
  if (!supabase) {
    return serverError("Missing env vars", {
      need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
    });
  }

  const organisation_id = await getOrgFromCookie(request, supabase);
  if (!organisation_id) {
    return badRequest("Missing organisation_id. Call /api/me/org first, then call /api/results?org_id=YOUR_ORG_ID");
  }

  try {
    const employer = await computeEmployer(supabase, organisation_id);
    const employee = await computeEmployee(supabase, organisation_id);

    const employerScore = employer.score;
    const employeeScore = employee.score;

    const hri =
      employerScore === null || employeeScore === null
        ? null
        : round1((employerScore * 0.5) + (employeeScore * 0.5));

    const band = bandFromScore(hri);

    // gaps: employee - employer per pillar
    const pillars = ["wellbeing", "growth", "inclusion", "trust", "leadership"];
    const gaps = {};
    for (const p of pillars) {
      const e = employer.pillars?.[p] ?? null;
      const ep = employee.pillars?.[p] ?? null;
      gaps[p] = e === null || ep === null ? null : round1(ep - e);
    }

    const payload = {
      ok: true,
      organisation_id,
      computed_at: new Date().toISOString(),
      employer: { score: employerScore, pillars: employer.pillars },
      employee: { score: employeeScore, pillars: employee.pillars },
      hri: { score: hri, band },
      gaps,
    };

    // Upsert into hri_scores (single source of truth)
    // Assumes hri_scores has organisation_id unique or primary key
    const { error: upErr } = await supabase.from("hri_scores").upsert(
      {
        organisation_id,
        hri_score: hri,
        employer_score: employerScore,
        employee_score: employeeScore,
        band,
        gaps,
        employer_pillars: employer.pillars,
        employee_pillars: employee.pillars,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organisation_id" }
    );

    if (upErr) {
      // Still return payload (so UI works) but flag it
      return NextResponse.json({ ...payload, upsert_ok: false, upsert_error: upErr.message }, { status: 200 });
    }

    return NextResponse.json({ ...payload, upsert_ok: true }, { status: 200 });
  } catch (e) {
    return serverError("Results Engine failed", { detail: e?.message || String(e) });
  }
}
