import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Hard-coded org for now – later this will come from the logged-in user
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  try {
    console.log("USING REAL /api/overview HANDLER");

    // 1) Latest assessment for your org
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select(
        "id, title, status, created_at, period_start, period_end, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aErr) throw aErr;

    if (!assessment) {
      return NextResponse.json(
        { ok: false, error: "No assessment found for this organisation" },
        { status: 404 }
      );
    }

    // 2) Pillar scores for that assessment
    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    if (sErr) throw sErr;

    const numericScores =
      (scores || [])
        .map((s) => Number(s.score))
        .filter((n) => Number.isFinite(n));

    const overallScore =
      numericScores.length > 0
        ? numericScores.reduce((sum, n) => sum + n, 0) / numericScores.length
        : null;

    const overview = {
      assessment_id: assessment.id,
      title: assessment.title,
      status: assessment.status,
      assessment_created_at: assessment.created_at || assessment.period_start,
      period_start: assessment.period_start,
      period_end: assessment.period_end,
      badge_level: assessment.badge_level,
      badge_awarded_at: assessment.badge_awarded_at,
      overall_score: overallScore,
    };

    // 3) Org metrics (employees, salary, etc.)
    const { data: orgMetrics, error: oErr } = await supabase
      .from("organisations")
      .select(
        "name, employee_count, avg_salary, turnover_rate, absent_days_per_employee, annual_wellbeing_spend, engagement_score"
      )
      .eq("id", ORG_ID)
      .maybeSingle();

    if (oErr) throw oErr;

    // 4) Simple ROI summary based on those org metrics
    let roiSummary = null;

    if (orgMetrics && orgMetrics.employee_count && orgMetrics.avg_salary) {
      const employees = Number(orgMetrics.employee_count) || 0;
      const avgSalary = Number(orgMetrics.avg_salary) || 0;
      const turnoverRate = Number(orgMetrics.turnover_rate) || 0; // %
      const absentDays = Number(orgMetrics.absent_days_per_employee) || 0;
      const wellbeingSpend = Number(orgMetrics.annual_wellbeing_spend) || 0;

      // Very simple v1 assumptions:
      // - Turnover cost ≈ 30% of salary for each leaver
      // - 220 working days per year
      const totalPayroll = employees * avgSalary;
      const estimatedTurnoverCost =
        employees * (turnoverRate / 100) * avgSalary * 0.3;

      const dailyCostPerEmployee = avgSalary / 220;
      const estimatedAbsenceCost =
        employees * absentDays * dailyCostPerEmployee;

      const totalPeopleRisk = estimatedTurnoverCost + estimatedAbsenceCost;

      const roiMultiplier =
        wellbeingSpend > 0 ? totalPeopleRisk / wellbeingSpend : null;

      roiSummary = {
        total_payroll: totalPayroll,
        estimated_turnover_cost: estimatedTurnoverCost,
        estimated_absence_cost: estimatedAbsenceCost,
        total_people_risk: totalPeopleRisk,
        annual_wellbeing_spend: wellbeingSpend,
        roi_multiplier: roiMultiplier,
      };
    }

    return NextResponse.json({
      ok: true,
      overview,
      scores: scores || [],
      org_metrics: orgMetrics || null,
      roi_summary: roiSummary,
    });
  } catch (err) {
    console.error("Error in /api/overview:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
