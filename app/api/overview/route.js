import { NextResponse } from "next/server";
import { supabaseServer } from "../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "OVERVIEW__V6__COOKIE_AUTH_NO_BEARER";

/**
 * Safe table fetch helper:
 * - If a table doesn't exist (or schema differs), we don't blow up the dashboard.
 */
async function safeQuery(run) {
  try {
    const { data, error } = await run();
    if (error) return { ok: false, error, data: null };
    return { ok: true, error: null, data };
  } catch (e) {
    return { ok: false, error: { message: e?.message || "Query failed" }, data: null };
  }
}

export async function GET(req) {
  try {
    const supabase = supabaseServer(req);

    // 1) Cookie auth (NO Bearer required)
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    // 2) Find org_id for the user
    const orgRes = await safeQuery(() =>
      supabase
        .from("organisation_users")
        .select("organisation_id")
        .eq("user_id", userData.user.id)
        .maybeSingle()
    );

    const organisation_id = orgRes?.data?.organisation_id || null;
    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No organisation linked to this user." },
        { status: 400 }
      );
    }

    // 3) Try to get latest assessment (support multiple table names)
    let latest = null;

    const latestA = await safeQuery(() =>
      supabase
        .from("assessments")
        .select("*")
        .eq("organisation_id", organisation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    );

    if (latestA.ok && latestA.data) latest = latestA.data;

    if (!latest) {
      const latestB = await safeQuery(() =>
        supabase
          .from("hri_assessments")
          .select("*")
          .eq("organisation_id", organisation_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      );
      if (latestB.ok && latestB.data) latest = latestB.data;
    }

    // 4) Attempt to pull scores/pillars (safe fallbacks)
    let pillar_scores = null;
    let overall_score = null;
    let badge = null;
    let badge_awarded_at = null;

    const assessmentId = latest?.id || latest?.assessment_id || null;

    // Try common score tables
    if (assessmentId) {
      const scores1 = await safeQuery(() =>
        supabase
          .from("assessment_scores")
          .select("*")
          .eq("assessment_id", assessmentId)
          .maybeSingle()
      );
      if (scores1.ok && scores1.data) {
        overall_score =
          scores1.data.overall_score ??
          scores1.data.hri_score ??
          scores1.data.score ??
          overall_score;

        badge = scores1.data.badge ?? scores1.data.badge_name ?? badge;
        badge_awarded_at = scores1.data.badge_awarded_at ?? badge_awarded_at;
      }

      const pillars1 = await safeQuery(() =>
        supabase
          .from("pillar_scores")
          .select("*")
          .eq("assessment_id", assessmentId)
          .order("created_at", { ascending: false })
      );
      if (pillars1.ok && Array.isArray(pillars1.data) && pillars1.data.length) {
        // Expected format from your UI: [{ label, value }]
        pillar_scores = pillars1.data.map((p) => ({
          label: p.pillar || p.pillar_name || p.label || "Pillar",
          value: p.score ?? p.value ?? null,
        }));
      }

      // Another common table name
      if (!pillar_scores) {
        const pillars2 = await safeQuery(() =>
          supabase
            .from("assessment_pillar_scores")
            .select("*")
            .eq("assessment_id", assessmentId)
        );
        if (pillars2.ok && Array.isArray(pillars2.data) && pillars2.data.length) {
          pillar_scores = pillars2.data.map((p) => ({
            label: p.pillar || p.pillar_name || p.label || "Pillar",
            value: p.score ?? p.value ?? null,
          }));
        }
      }

      // Another overall score table name
      if (overall_score == null) {
        const overall2 = await safeQuery(() =>
          supabase
            .from("hri_scores")
            .select("*")
            .eq("assessment_id", assessmentId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
        );
        if (overall2.ok && overall2.data) {
          overall_score =
            overall2.data.overall_score ??
            overall2.data.hri_score ??
            overall2.data.score ??
            overall_score;

          badge = overall2.data.badge ?? overall2.data.badge_name ?? badge;
          badge_awarded_at = overall2.data.badge_awarded_at ?? badge_awarded_at;
        }
      }
    }

    // 5) Return in a shape your dashboard already supports
    const overview = {
      version: VERSION,
      organisation_id,
      latest_assessment: latest
        ? {
            id: latest.id || latest.assessment_id || null,
            title: latest.title || latest.name || "HRI Assessment",
            status: latest.status || "—",
            period_start: latest.period_start || latest.start_date || null,
            period_end: latest.period_end || latest.end_date || null,
            created_at: latest.created_at || null,
          }
        : null,

      overall_score: overall_score ?? null,
      badge: badge ?? null,
      badge_awarded_at: badge_awarded_at ?? null,
      pillar_scores: pillar_scores ?? null,
    };

    return NextResponse.json({ ok: true, version: VERSION, overview });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
