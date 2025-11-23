// src/app/api/assessment-scores/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function GET(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessment_id");

    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: "Missing assessment_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("scores") // uses your existing scores table
      .select("pillar, score")
      .eq("assessment_id", assessmentId);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      scores: data || [],
    });
  } catch (err) {
    console.error("Error in assessment-scores API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
