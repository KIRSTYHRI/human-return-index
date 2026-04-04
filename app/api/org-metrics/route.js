import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ORG_METRICS__V8__NO_ABSENCE_COLUMN";

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
        organisation_name: orgRow?.organisation_name ?? "",
        employees: orgRow?.employees ?? null,
        avg_salary: orgRow?.average_salary ?? null,
        turnover_rate: orgRow?.turnover_rate ?? null,
        absence_days: null,
        wellbeing_spend: orgRow?.annual_wellbeing_spend ?? null,
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

    const organisation_name = (body?.organisation_name || "").trim();
    const employees = toNumberOrNull(body?.employees);
    const avg_salary = toNumberOrNull(body?.avg_salary);
    const turnover_rate = toNumberOrNull(body?.turnover_rate);
    const wellbeing_spend = toNumberOrNull(body?.wellbeing_spend);
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
      organisation_name: organisation_name || null,
      employees,
      average_salary: avg_salary,
      turnover_rate,
      annual_wellbeing_spend: wellbeing_spend,
      engagement_score,
      updated_at: new Date().toISOString(),
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
      organisation: data || null,
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
