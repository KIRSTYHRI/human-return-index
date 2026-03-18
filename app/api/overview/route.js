import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "OVERVIEW__V15__WITH_HISTORY";

function getServiceSupabase() {
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

function blendEqual(employeeValue, employerValue) {
  const e = toNumber(employeeValue);
  const m = toNumber(employerValue);

  if (e != null && m != null) return Math.round(((e + m) / 2) * 10) / 10;
  if (e != null) return e;
  if (m != null) return m;
  return null;
}

function noStoreJson(body, status = 200) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    },
  });
}

export async function GET(req) {
  try {
    const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;
    const { user, error } = await getAuthUser(req);
    const supabase = getServiceSupabase();

    const { searchParams } = new URL(req.url);
    const queryOrgId =
      searchParams.get("organisation_id") ||
      searchParams.get("organization_id") ||
      null;

    const organisation_id = demoOrgId || queryOrgId || null;

    if (!user && !organisation_id) {
      return noStoreJson(
        { ok: false, version: VERSION, error: error || "Auth session missing!" },
        401
      );
    }

    if (!organisation_id) {
      return noStoreJson(
        {
          ok: false,
          version: VERSION,
          error:
            "Missing organisation_id. Pass organisation_id in querystring or set HRI_DEMO_ORG_ID.",
        },
        400
      );
    }

    // CURRENT LIVE SCORE
    const { data: hriRow, error: hriErr } = await supabase
      .from("hri_scores")
      .select("*")
      .eq("organisation_id", organisation_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (hriErr) {
      return noStoreJson(
        { ok: false, version: VERSION, error: hriErr.message },
        500
      );
    }

    // SCORE HISTORY - latest two records
    const { data: historyRows, error: historyErr } = await supabase
      .from("hri_score_history")
      .select("id, hri_score, created_at")
      .eq("organisation_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(2);

    if (historyErr) {
      return noStoreJson(
        { ok: false, version: VERSION, error: historyErr.message },
        500
      );
    }

    const currentHistoryRow = historyRows?.[0] || null;
    const previousHistoryRow = historyRows?.[1] || null;

    const currentScore =
      hriRow?.hri_score != null
        ? Number(hriRow.hri_score)
        : currentHistoryRow?.hri_score != null
        ? Number(currentHistoryRow.hri_score)
        : null;

    const previousScore =
      previousHistoryRow?.hri_score != null
        ? Number(previousHistoryRow.hri_score)
        : null;

    const scoreChange =
      currentScore != null && previousScore != null
        ? Math.round((currentScore - previousScore) * 10) / 10
        : null;

    // LATEST VALID EMPLOYER ASSESSMENTS
    const { data: assessmentRows, error: assessErr } = await supabase
      .from("hri_assessments")
      .select("id, org_id, title, overall_score, pillar_scores, created_at")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (assessErr) {
      return noStoreJson(
        { ok: false, version: VERSION, error: assessErr.message },
        500
      );
    }

    const validAssessments = (assessmentRows || []).filter(
      (row) =>
        row?.overall_score != null &&
        row?.pillar_scores &&
        typeof row.pillar_scores === "object" &&
        Object.keys(row.pillar_scores).length > 0
    );

    const latestAssessment = validAssessments[0] || null;
    const previousAssessment = validAssessments[1] || null;

    const pillar_scores = hriRow
      ? {
          "Human-Centred Leadership": blendEqual(
            hriRow.employee_pillar_1,
            hriRow.employer_pillar_1
          ),
          "Wellbeing & Mental Health": blendEqual(
            hriRow.employee_pillar_2,
            hriRow.employer_pillar_2
          ),
          "Inclusion, Safety & Belonging": blendEqual(
            hriRow.employee_pillar_3,
            hriRow.employer_pillar_3
          ),
          "Growth, Learning & Performance": blendEqual(
            hriRow.employee_pillar_4,
            hriRow.employer_pillar_4
          ),
          "Trust, Communication & Clarity": blendEqual(
            hriRow.employee_pillar_5,
            hriRow.employer_pillar_5
          ),
        }
      : null;

    return noStoreJson({
      ok: true,
      version: VERSION,
      demo: !user,
      organisation_id,
      user_id: user?.id || null,
      overview: {
        overall_score: currentScore,
        previous_score: previousScore,
        score_change: scoreChange,
        employer_score:
          hriRow?.employer_score != null ? Number(hriRow.employer_score) : null,
        employee_score:
          hriRow?.employee_score != null ? Number(hriRow.employee_score) : null,
        badge: hriRow?.badge || null,
        updated_at: hriRow?.updated_at || currentHistoryRow?.created_at || null,
        pillar_scores,
        latest_assessment: latestAssessment
          ? {
              id: latestAssessment.id,
              title: latestAssessment.title || "HRI Assessment",
              created_at: latestAssessment.created_at,
              overall_score:
                latestAssessment.overall_score != null
                  ? Number(latestAssessment.overall_score)
                  : null,
            }
          : null,
        previous_assessment: previousAssessment
          ? {
              id: previousAssessment.id,
              title: previousAssessment.title || "HRI Assessment",
              created_at: previousAssessment.created_at,
              overall_score:
                previousAssessment.overall_score != null
                  ? Number(previousAssessment.overall_score)
                  : null,
            }
          : null,
      },
    });
  } catch (err) {
    return noStoreJson(
      {
        ok: false,
        version: VERSION,
        error: err?.message || "Failed to load overview",
      },
      500
    );
  }
}
