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

  // Assume: cost of turnover ≈ 30% of salary bill for leavers
  const turnoverRate = turnoverRatePct / 100;
  const estimatedTurnoverCost = totalPayroll * turnoverRate * 0.3;

  // Absence: salary / 220 working days * days off * headcount
  const dailyRate = avgSalary / 220 || 0;
  const estimatedAbsenceCost = employees * absentDays * dailyRate;

  const totalPeopleRisk = estimatedTurnoverCost + estimatedAbsenceCost;
  const roiMultiplier =
    wellbeingSpend > 0 ? totalPeopleRisk / wellbeingSpend : null;

  return {
    total_payroll: totalPayroll,
    estimated_turnover_cost: estimatedTurnoverCost,
    estimated_absence_cost: estimatedAbsenceCost,
    total_people_risk: totalPeopleRisk,
    annual_wellbeing_spend: wellbeingSpend,
    roi_multiplier: roiMultiplier,
  };
}

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    // 1️⃣ Get latest assessment (Pilot / current org)
    const { data: assessments, error: assessError } = await supabase
      .from("assessments")
      .select(
        "id, title, status, period_start, period_end, created_at, overall_score, badge_level, badge_awarded_at, org_id"
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (assessError) {
      console.error("Assessment fetch error:", assessError);
      return NextResponse.json(
        { ok: false, error: assessError.message },
        { status: 500 }
      );
    }

    const assessment = assessments?.[0];

    if (!assessment) {
      return NextResponse.json(
        { ok: false, error: "No assessment found" },
        { status: 404 }
      );
    }

    // 2️⃣ Org metrics for ROI & header cards
    let orgMetrics = null;
    if (assessment.org_id) {
      const { data: metrics, error: metricsError } = await supabase
        .from("org_metrics")
        .select("*")
        .eq("org_id", assessment.org_id)
        .single();

      if (metricsError) {
        console.warn("Org metrics fetch warning:", metricsError.message);
      } else {
        orgMetrics = metrics;
      }
    }

    // 3️⃣ Scores – only latest per pillar
    const { data: rawScores, error: scoresError } = await supabase
      .from("scores")
      .select("pillar, score, created_at")
      .eq("assessment_id", assessment.id)
      .order("created_at", { ascending: false });

    if (scoresError) {
      console.error("Scores fetch error:", scoresError);
      return NextResponse.json(
        { ok: false, error: scoresError.message },
        { status: 500 }
      );
    }

    const uniqueScores = [];
    const seen = new Set();

    for (const row of rawScores || []) {
      if (!seen.has(row.pillar)) {
        uniqueScores.push({
          pillar: row.pillar,
          score: row.score,
        });
        seen.add(row.pillar);
      }
    }

    // 4️⃣ Build overview object for dashboard
    const overview = {
      title: assessment.title,
      status: assessment.status,
      period_start: assessment.period_start,
      period_end: assessment.period_end,
      assessment_created_at: assessment.created_at,
      overall_score: assessment.overall_score,
      badge_level: assessment.badge_level,
      badge_awarded_at: assessment.badge_awarded_at,
    };

    // 5️⃣ ROI summary from org metrics
    const roiSummary = buildRoiSummary(orgMetrics);

    return NextResponse.json({
      ok: true,
      overview,
      scores: uniqueScores,
      org_metrics: orgMetrics,
      roi_summary: roiSummary,
    });
  } catch (err) {
    console.error("Error in overview API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
