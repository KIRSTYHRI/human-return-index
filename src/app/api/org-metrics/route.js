import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org id we used in /api/overview
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

// GET = fetch current org metrics
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("org_metrics")
      .select(
        "organisation_id, employee_count, avg_salary, turnover_rate, absent_days_per_employee, annual_wellbeing_spend, engagement_score"
      )
      .eq("organisation_id", ORG_ID)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      org_metrics: data || null,
    });
  } catch (err) {
    console.error("Error in GET /api/org-metrics:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST = update org metrics
export async function POST(request) {
  try {
    const body = await request.json();

    const {
      employee_count,
      avg_salary,
      turnover_rate,
      absent_days_per_employee,
      annual_wellbeing_spend,
      engagement_score,
    } = body || {};

    // Basic sanity checks
    const payload = {
      organisation_id: ORG_ID,
      employee_count: employee_count != null ? Number(employee_count) : null,
      avg_salary: avg_salary != null ? Number(avg_salary) : null,
      turnover_rate: turnover_rate != null ? Number(turnover_rate) : null,
      absent_days_per_employee:
        absent_days_per_employee != null
          ? Number(absent_days_per_employee)
          : null,
      annual_wellbeing_spend:
        annual_wellbeing_spend != null
          ? Number(annual_wellbeing_spend)
          : null,
      engagement_score:
        engagement_score != null ? Number(engagement_score) : null,
    };

    const { data, error } = await supabase
      .from("org_metrics")
      .upsert(payload, {
        onConflict: "organisation_id",
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      org_metrics: data,
    });
  } catch (err) {
    console.error("Error in POST /api/org-metrics:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
