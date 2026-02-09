import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // Demo payload so dashboard shows the same "pretty" numbers consistently
  return NextResponse.json({
    ok: true,
    metrics: {
      organisation_name: "Your organisation",
      employees: 260,
      avg_salary: 40000,
      turnover_rate: 15,
      absence_days: 6.6,
      wellbeing_spend: 25000,
      engagement_score: 72
    }
  });
}
