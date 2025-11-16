// src/app/api/overview/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d"; // your seeded org

export async function GET() {
  try {
    // 1) Get latest assessment for your org
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
      console.error("Assessment error:", aError);
      return NextResponse.json(
        { ok: false, error: aError.message },
        { status: 500 }
      );
    }

    if (!assessment) {
      return NextResponse.json(
        { ok: false, error: "No assessments found" },
        { status: 404 }
      );
    }

    // 2) Get scores for that assessment
    const { data: scores, error: sError } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessment.id);

    if (sError) {
      console.error("Scores error:", sError);
      return NextResponse.json(
        { ok: false, error: sError.message },
        { status: 500 }
      );
    }

    // 3) Shape the response for the dashboard
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
      overview,
      scores: scores ?? [],
    });
  } catch (err) {
    console.error("Unexpected /api/overview error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
