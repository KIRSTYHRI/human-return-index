import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ORG_METRICS__V9__MATCHES_DB_SCHEMA";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function toNumberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function getOrganisationIdForUser(supabase, userId) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile?.organisation_id) {
    throw new Error("No organisation linked to this user profile.");
  }

  return profile.organisation_id;
}

export async function GET(req) {
  try {
    const { user, error } = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: error || "Auth session missing!",
        },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();
    const organisation_id = await getOrganisationIdForUser(supabase, user.id);

    const { data: orgRow, error: orgError } = await supabase
      .from("organisations")
      .select("*")
      .eq("id", organisation_id)
      .maybeSingle();

    if (orgError) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: orgError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      organisation_id,
      metrics: {
        name: orgRow?.name ?? "",
        employee_count: orgRow?.employee_count ?? null,
        avg_salary: orgRow?.avg_salary ?? null,
        turnover_rate: orgRow?.turnover_rate ?? null,
        absent_days_per_employee: orgRow?.absent_days_per_employee ?? null,
        annual_wellbeing_spend: orgRow?.annual_wellbeing_spend ?? null,
        engagement_score: orgRow?.engagement_score ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: err?.message || "Failed to load org metrics",
      },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { user, error } = await getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: error || "Auth session missing!",
        },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();
    const organisation_id = await getOrganisationIdForUser(supabase, user.id);

    const body = await req.json().catch(() => ({}));

    // Accept both old frontend names and correct DB-aligned names
    const name = (body?.name || body?.organisation_name || "").trim();
    const employee_count = toNumberOrNull(body?.employee_count ?? body?.employees);
    const avg_salary = toNumberOrNull(body?.avg_salary ?? body?.average_salary);
    const turnover_rate = toNumberOrNull(body?.turnover_rate);
    const absent_days_per_employee = toNumberOrNull(
      body?.absent_days_per_employee ?? body?.absence_days_per_employee ?? body?.absence_days
    );
    const annual_wellbeing_spend = toNumberOrNull(
      body?.annual_wellbeing_spend ?? body?.wellbeing_spend
    );
    const engagement_score = toNumberOrNull(body?.engagement_score);

    if (
      engagement_score !== null &&
      (engagement_score < 0 || engagement_score > 100)
    ) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "Engagement score must be between 0 and 100.",
        },
        { status: 400 }
      );
    }

    const updatePayload = {
      name: name || null,
      employee_count,
      avg_salary,
      turnover_rate,
      absent_days_per_employee,
      annual_wellbeing_spend,
      engagement_score,
    };

    const { data, error: updateError } = await supabase
      .from("organisations")
      .update(updatePayload)
      .eq("id", organisation_id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      organisation_id,
      saved: true,
      metrics: {
        name: data?.name ?? "",
        employee_count: data?.employee_count ?? null,
        avg_salary: data?.avg_salary ?? null,
        turnover_rate: data?.turnover_rate ?? null,
        absent_days_per_employee: data?.absent_days_per_employee ?? null,
        annual_wellbeing_spend: data?.annual_wellbeing_spend ?? null,
        engagement_score: data?.engagement_score ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: err?.message || "Failed to save org metrics",
      },
      { status: 500 }
    );
  }
}
