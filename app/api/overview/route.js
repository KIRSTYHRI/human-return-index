import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "OVERVIEW__V11__LIVE";

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

export async function GET(req) {
  try {
    const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;
    const { user, error } = await getAuthUser(req);
    const supabase = getServiceSupabase();

    const organisation_id = demoOrgId || null;

    if (!user && !organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: error || "Auth session missing!" },
        { status: 401 }
      );
    }

    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Missing organisation_id" },
        { status: 400 }
      );
    }

    const { data: hriRow, error: hriErr } = await supabase
      .from("hri_scores")
      .select("*")
      .eq("organisation_id", organisation_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (hriErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: hriErr.message },
        { status: 500 }
      );
    }

    const { data: assessmentRows, error: assessErr } = await supabase
      .from("hri_assessments")
      .select("id, org_id, title, overall_score, pillar_scores, created_at")
      .eq("org_id", organisation_id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (assessErr) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: assessErr.message },
        { status: 500 }
      );
    }

    const latestAssessment =
      (assessmentRows || []).find(
        (row) =>
          row?.overall_score != null &&
          row?.pillar_scores &&
          typeof row.pillar_scores === "object" &&
          Object.keys(row.pillar_scores).length > 0
      ) || null;

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

    return NextResponse.json({
      ok: true,
      version: VERSION,
      demo: !user,
      organisation_id,
      user_id: user?.id || null,
      overview: {
  overall_score: hriRow?.hri_score != null ? Number(hriRow.hri_score) : null,
  employer_score: hriRow?.employer_score != null ? Number(hriRow.employer_score) : null,
  employee_score: hriRow?.employee_score != null ? Number(hriRow.employee_score) : null,
  badge: hriRow?.badge || null,
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
}
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: err?.message || "Failed to load overview" },
      { status: 500 }
    );
  }
}
