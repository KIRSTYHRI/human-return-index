import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ORG_METRICS__V3__DEMO_READY";

export async function GET() {
  return NextResponse.json({
    ok: true,
    version: VERSION,
    demo: true, // 👈 tells frontend this is example data
    metrics: {
      organisation_name: "Example organisation",
      employees: 260,
      avg_salary: 40000,
      turnover_rate: 15,
      absence_days: 6.6,
      wellbeing_spend: 25000,
      engagement_score: 72
    }
  });
}
