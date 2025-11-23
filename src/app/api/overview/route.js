import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

// 🔐 TEMP: single-org isolation – HRI org ID
// If your org ID is different, replace this value with your real one.
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

// ROI calculator
function buildRoiSummary(orgMetrics) {
  if (!orgMetrics) return null;

  const employees = Number(orgMetrics.employee_count) || 0;
  const avgSalary = Number(orgMetrics.avg_salary) || 0;
  const turnoverRatePct = Number(orgMetrics.turnover_rate) || 0;
  const absentDays = Number(orgMetrics.absent_days_per_employee) || 0;
  const wellbeingSpend = Number(orgMetrics.annual_wellbeing_spend) || 0;

  const totalPayroll = employees * avgSalary;
  const turnoverRate = turnoverRatePct / 100;
  const estimatedTurnoverCost = totalPayroll * turnoverRate * 0.3;
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

export async function GET(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    if (!ORG_ID) {
      return NextResponse.json(
        { ok: false, error: "ORG_ID not configured in overview API" },
        { status: 500 }
      );
    }

    // 1️⃣ Latest assessment FOR THIS ORG ONLY
    const { data: assessments, error: assessError } = await supabase
      .from("assessments")
      .select(
        "id, title, status, period_start, period_end, created_at, overall_score, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", ORG_ID)
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
        { ok: false, error: "No assessment found for this organisation" },
        { status: 404 }
      );
    }

    // 2️⃣ Org metrics – latest row for THIS ORG ONLY
    let orgMetrics = null;
    const { data: metrics, error: metricsError } = await supabase
      .from("org_metrics")
      .select("*")
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (metricsError) {
      console.warn("Org metrics fetch warning:", metricsError.message);
    } else {
      orgMetrics = metrics || null;
    }

    // 3️⃣ Scores – 1 row per pillar for this assessment
    const { data: scoresData, error: scoresError } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    if (scoresError) {
      console.error("Scores fetch error:", scoresError);
      return NextResponse.json(
        { ok: false, error: scoresError.message },
        { status: 500 }
      );
    }

    // 4️⃣ Overview object
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

    // 5️⃣ ROI from org metrics
    const roiSummary = buildRoiSummary(orgMetrics);

    // 6️⃣ Pulse summary – latest pulse (still global for now, org scoping later)
    let pulseSummary = null;

    const { data: latestPulseRow, error: latestPulseError } = await supabase
      .from("employee_pulse_responses")
      .select("pulse_id, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestPulseError) {
      console.warn("Latest pulse fetch warning:", latestPulseError.message);
    } else if (latestPulseRow && latestPulseRow.pulse_id) {
      const latestPulseId = latestPulseRow.pulse_id;

      const { data: pulseResponses, error: pulseRespError } = await supabase
        .from("employee_pulse_responses")
        .select("question_id, response_value")
        .eq("pulse_id", latestPulseId);

      if (pulseRespError) {
        console.warn("Pulse responses fetch warning:", pulseRespError.message);
      } else if (pulseResponses && pulseResponses.length > 0) {
        const questionIds = [
          ...new Set(
            pulseResponses
              .map((r) => r.question_id)
              .filter((id) => id != null)
          ),
        ];

        if (questionIds.length > 0) {
          const { data: pulseQuestions, error: pulseQError } = await supabase
            .from("employee_questions")
            .select("id, pillar")
            .in("id", questionIds);

          if (pulseQError) {
            console.warn("Pulse questions fetch warning:", pulseQError.message);
          } else if (pulseQuestions && pulseQuestions.length > 0) {
            const pillarByQuestionId = new Map();
            for (const q of pulseQuestions) {
              pillarByQuestionId.set(q.id, q.pillar || "Other");
            }

            const grouped = {};
            for (const r of pulseResponses) {
              const pillar = pillarByQuestionId.get(r.question_id) || "Other";
              const value = Number(r.response_value);
              if (!Number.isFinite(value)) continue;

              if (!grouped[pillar]) grouped[pillar] = [];
              grouped[pillar].push(value);
            }

            const entries = Object.entries(grouped);
            if (entries.length > 0) {
              pulseSummary = entries.map(([pillar, values]) => ({
                pillar,
                score:
                  values.reduce((sum, v) => sum + v, 0) / values.length,
              }));
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      overview,
      scores: scoresData || [],
      org_metrics: orgMetrics,
      roi_summary: roiSummary,
      pulse_summary: pulseSummary,
    });
  } catch (err) {
    console.error("Error in overview API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
