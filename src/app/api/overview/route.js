import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

function buildRoiSummary(orgMetrics) {
  if (!orgMetrics) return null;

  const employees = Number(orgMetrics.employee_count) || 0;
  const avgSalary = Number(orgMetrics.avg_salary) || 0;
  const turnoverRatePct = Number(orgMetrics.turnover_rate) || 0;
  const absentDays = Number(orgMetrics.absent_days_per_employee) || 0;
  const wellbeingSpend = Number(orgMetrics.annual_wellbeing_spend) || 0;

  const totalPayroll = employees * avgSalary;
  const estimatedTurnoverCost = totalPayroll * (turnoverRatePct / 100) * 0.3;
  const estimatedAbsenceCost = employees * absentDays * (avgSalary / 220);

  return {
    total_payroll: totalPayroll,
    estimated_turnover_cost: estimatedTurnoverCost,
    estimated_absence_cost: estimatedAbsenceCost,
    total_people_risk: estimatedTurnoverCost + estimatedAbsenceCost,
    annual_wellbeing_spend: wellbeingSpend,
    roi_multiplier:
      wellbeingSpend > 0
        ? (estimatedTurnoverCost + estimatedAbsenceCost) / wellbeingSpend
        : null,
  };
}

export async function GET(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    // ✅ 1) Get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // ✅ 2) Get user's organisation
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.organisation_id) {
      return NextResponse.json(
        { ok: false, error: "No organisation assigned" },
        { status: 400 }
      );
    }

    const orgId = profile.organisation_id;

    // ✅ 3) Get latest assessment for THIS org
    const { data: assessment, error: assessError } = await supabase
      .from("assessments")
      .select(
        "id, title, status, period_start, period_end, created_at, overall_score, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessError || !assessment) {
      return NextResponse.json(
        { ok: false, error: "No assessment found" },
        { status: 404 }
      );
    }

    // ✅ 4) Org metrics
    const { data: orgMetrics } = await supabase
      .from("org_metrics")
      .select("*")
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // ✅ 5) Scores
    const { data: scores } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    const overview = {
      assessment_id: assessment.id,
      title: assessment.title,
      status: assessment.status,
      period_start: assessment.period_start,
      period_end: assessment.period_end,
      assessment_created_at: assessment.created_at,
      overall_score: assessment.overall_score,
      badge_level: assessment.badge_level,
      badge_awarded_at: assessment.badge_awarded_at,
    };

    return NextResponse.json({
      ok: true,
      overview,
      scores: scores || [],
      org_metrics: orgMetrics,
      roi_summary: buildRoiSummary(orgMetrics),
    });
  } catch (err) {
    console.error("Error in overview API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
