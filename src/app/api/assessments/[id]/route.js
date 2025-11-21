import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

export async function GET(req, { params }) {
  try {
    const assessmentId = params.id;

    console.log("Looking up assessment:", assessmentId);

    // 1) Fetch assessment
    const { data: assessment, error: aErr } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", assessmentId)
      .maybeSingle();

    if (aErr) throw aErr;
    if (!assessment) {
      return NextResponse.json(
        { ok: false, error: "Assessment not found" },
        { status: 404 }
      );
    }

    // 2) Fetch scores
    const { data: scores, error: sErr } = await supabase
      .from("scores")
      .select("pillar, score")
      .eq("assessment_id", assessmentId);

    if (sErr) throw sErr;

    return NextResponse.json({
      ok: true,
      assessment,
      scores,
    });
  } catch (err) {
    console.error("Error in /api/assessments/[id]:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

