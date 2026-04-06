import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "EMPLOYEE_PULSE__PUBLIC_OR_AUTH__V1";

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

function normaliseAnswers(rawAnswers) {
  if (!rawAnswers || typeof rawAnswers !== "object") return {};

  const cleaned = {};

  for (const [questionId, value] of Object.entries(rawAnswers)) {
    const num = Number(value);
    if (Number.isFinite(num)) {
      cleaned[questionId] = num;
    }
  }

  return cleaned;
}

export async function POST(req) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json().catch(() => ({}));

    let organisation_id = body?.organisation_id || null;

    // Public pulse link can send organisation_id directly.
    // If not provided, fall back to logged-in user flow.
    if (!organisation_id) {
      const { user, error } = await getAuthUser(req);

      if (!user) {
        return NextResponse.json(
          {
            ok: false,
            version: VERSION,
            error: error || "Auth session missing and no organisation_id supplied.",
          },
          { status: 401 }
        );
      }

      organisation_id = await getOrganisationIdForUser(supabase, user.id);
    }

    if (!organisation_id) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "Missing organisation_id.",
        },
        { status: 400 }
      );
    }

    const answers = normaliseAnswers(body?.answers);

    if (!Object.keys(answers).length) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "No answers submitted.",
        },
        { status: 400 }
      );
    }

    const submission = {
      organisation_id,
      answers,
      created_at: new Date().toISOString(),
    };

    const { data, error: insertError } = await supabase
      .from("employee_pulse")
      .insert(submission)
      .select("*")
      .maybeSingle();

    if (insertError) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: insertError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      saved: true,
      organisation_id,
      submission: data || null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: err?.message || "Failed to submit employee pulse",
      },
      { status: 500 }
    );
  }
}
