// src/app/api/overview/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase =
  url && key
    ? createClient(url, key, { auth: { persistSession: false } })
    : null;

const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d"; // your seeded org

export async function GET() {
  try {
    // 1) ENV sanity check
    if (!url || !key) {
      return NextResponse.json(
        {
          ok: false,
          step: "env-check",
          urlPresent: !!url,
          keyPresent: !!key,
          message:
            "Supabase URL or SERVICE ROLE key missing in environment variables",
        },
        { status: 500 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          step: "client-check",
          message: "Supabase client was not created",
        },
        { status: 500 }
      );
    }

    // 2) Check org exists
    const { data: orgs, error: orgError } = await supabase
      .from("organisations")
      .select("id, name")
      .eq("id", ORG_ID)
      .limit(1);

    if (orgError) {
      return NextResponse.json(
        {
          ok: false,
          step: "org-query",
          message: orgError.message,
        },
        { status: 500 }
      );
    }

    // 3) Get latest assessment
    const { data: assessment, error: aError } = await supabase
      .from("assessments")
      .select(
        "id, title, status, period_start, period_end, badge_level, badge_awarded_at, created_at"
      )
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (aError) {
      return NextResponse.json(
        { ok: false, step: "assessment-query", message: aError.message },
        { status: 500 }
      );
    }

    if (!assessment) {
      return NextResponse.json(
        { ok: false, step: "no-assessment", message: "No assessments found" },
        { status: 404 }
      );
    }

    // 4) Scores
    const { data: scores, error: sError } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    if (sError) {
      return NextResponse.json(
        { ok: false, step: "scores-query", message: sError.message },
        { status: 500 }
      );
    }

    const overview = {
      assessment_id: assessment.id,
      title: assessment.title,
      status: assessment.status,
      assessment_created_at: assessment.created_at,
      period_start: assessment.period_start,
      period_end: assessment.period_end,
      badge_level: assessment.badge_level,
      badge_awarded_at: assessment.badge_awarded_at,
    };

    return NextResponse.json({
      ok: true,
      source: "supabase",
      debug: {
        urlPresent: !!url,
        keyPresent: !!key,
        orgCount: orgs?.length ?? 0,
      },
      overview,
      scores: scores ?? [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        step: "exception",
        message: String(err),
        urlPresent: !!url,
        keyPresent: !!key,
      },
      { status: 500 }
    );
  }
}
