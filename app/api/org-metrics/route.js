import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ORG_METRICS__V5__REAL_ORG";

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

export async function GET(req) {
  try {
    const { user, error } = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: error || "Auth session missing!" },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organisation_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: profileError.message },
        { status: 500 }
      );
    }

    const organisation_id = profile?.organisation_id || null;

    if (!organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No organisation linked to this user profile." },
        { status: 400 }
      );
    }

    // Try to read from organisations table first
    const { data: orgRow, error: orgError } = await supabase
      .from("organisations")
      .select("*")
      .eq("id", organisation_id)
      .maybeSingle();

    if (orgError) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: orgError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      demo: false,
      organisation_id,
      metrics: {
        organisation_name:
          orgRow?.name ||
          orgRow?.organisation_name ||
          "Your organisation",
        employees:
          orgRow?.employees ??
          orgRow?.headcount ??
          null,
        avg_salary:
          orgRow?.avg_salary ??
          orgRow?.average_salary ??
          null,
        turnover_rate:
          orgRow?.turnover_rate ??
          null,
        absence_days:
          orgRow?.absence_days ??
          orgRow?.absence_days_per_employee ??
          null,
        wellbeing_spend:
          orgRow?.wellbeing_spend ??
          orgRow?.annual_wellbeing_spend ??
          null,
        engagement_score:
          orgRow?.engagement_score ??
          null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: err?.message || "Failed to load org metrics" },
      { status: 500 }
    );
  }
}
