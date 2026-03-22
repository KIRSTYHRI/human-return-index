import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ORG_METRICS__V4__COOKIE_BACKED";
const COOKIE_NAME = "hri_org_metrics";

function getDefaultMetrics() {
  return {
    organisation_name: "Example organisation",
    employees: 260,
    avg_salary: 40000,
    turnover_rate: 15,
    absence_days: 6.6,
    wellbeing_spend: 25000,
    engagement_score: 72,
  };
}

export async function GET(req) {
  try {
    const raw = req.cookies.get(COOKIE_NAME)?.value || null;

    if (!raw) {
      return NextResponse.json({
        ok: true,
        version: VERSION,
        demo: true,
        metrics: getDefaultMetrics(),
      });
    }

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed !== "object") {
      return NextResponse.json({
        ok: true,
        version: VERSION,
        demo: true,
        metrics: getDefaultMetrics(),
      });
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      demo: false,
      metrics: {
        organisation_name: parsed.organisation_name ?? "Your organisation",
        employees: parsed.employees ?? null,
        avg_salary: parsed.avg_salary ?? null,
        turnover_rate: parsed.turnover_rate ?? null,
        absence_days: parsed.absence_days ?? null,
        wellbeing_spend: parsed.wellbeing_spend ?? null,
        engagement_score: parsed.engagement_score ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: err?.message || "Failed to load org metrics" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();

    const metrics = {
      organisation_name: body?.organisation_name || "Your organisation",
      employees: body?.employees === "" ? null : Number(body?.employees),
      avg_salary: body?.avg_salary === "" ? null : Number(body?.avg_salary),
      turnover_rate: body?.turnover_rate === "" ? null : Number(body?.turnover_rate),
      absence_days: body?.absence_days === "" ? null : Number(body?.absence_days),
      wellbeing_spend: body?.wellbeing_spend === "" ? null : Number(body?.wellbeing_spend),
      engagement_score: body?.engagement_score === "" ? null : Number(body?.engagement_score),
    };

    const response = NextResponse.json({
      ok: true,
      version: VERSION,
      demo: false,
      metrics,
    });

    response.cookies.set(COOKIE_NAME, JSON.stringify(metrics), {
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: err?.message || "Failed to save org metrics" },
      { status: 500 }
    );
  }
}
