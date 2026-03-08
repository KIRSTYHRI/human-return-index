import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "OVERVIEW__V11__LIVE_HRI";

export async function GET(req) {
  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;
  const { user, error } = await getAuthUser(req);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const organisation_id = demoOrgId;

  if (!organisation_id && !user) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: error || "Auth session missing!" },
      { status: 401 }
    );
  }

  // latest HRI score
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

  // latest employer assessment
  const { data: assessmentRow, error: assessErr } = await supabase
    .from("assessments")
    .select("*")
    .eq("organisation_id", organisation_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assessErr) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: assessErr.message },
      { status: 500 }
    );
  }

  // blended pillar scores if both employer + employee exist, otherwise employee only
  const pillarScores = hriRow
    ? {
        "Human-Centred Leadership":
          hriRow.employer_pillar_1 != null
            ? (Number(hriRow.employee_pillar_1) + Number(hriRow.employer_pillar_1)) / 2
            : Number(hriRow.employee_pillar_1),
        "Wellbeing & Mental Health":
          hriRow.employer_pillar_2 != null
            ? (Number(hriRow.employee_pillar_2) + Number(hriRow.employer_pillar_2)) / 2
            : Number(hriRow.employee_pillar_2),
        "Inclusion, Safety & Belonging":
          hriRow.employer_pillar_3 != null
            ? (Number(hriRow.employee_pillar_3) + Number(hriRow.employer_pillar_3)) / 2
            : Number(hriRow.employee_pillar_3),
        "Growth, Learning & Performance":
          hriRow.employer_pillar_4 != null
            ? (Number(hriRow.employee_pillar_4) + Number(hriRow.employer_pillar_4)) / 2
            : Number(hriRow.employee_pillar_4),
        "Trust, Communication & Clarity":
          hriRow.employer_pillar_5 != null
            ? (Number(hriRow.employee_pillar_5) + Number(hriRow.employer_pillar_5)) / 2
            : Number(hriRow.employee_pillar_5),
      }
    : null;

  return NextResponse.json({
    ok: true,
    version: VERSION,
    organisation_id,
    user_id: user?.id || null,
    demo: !user,
    overview: {
      overall_score: hriRow?.hri_score != null ? Number(hriRow.hri_score) : null,
      badge: hriRow?.badge || null,
      pillar_scores: pillarScores,
      latest_assessment: assessmentRow
        ? {
            title: assessmentRow.title,
            status: assessmentRow.status,
            created_at: assessmentRow.created_at,
            period_start: assessmentRow.period_start,
            period_end: assessmentRow.period_end,
          }
        : null,
    },
  });
}
