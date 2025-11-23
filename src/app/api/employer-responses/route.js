// src/app/api/employer-responses/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function POST(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { assessment_id, answers } = body;

    if (!assessment_id || !answers || typeof answers !== "object") {
      return NextResponse.json(
        { ok: false, error: "Missing assessment_id or answers" },
        { status: 400 }
      );
    }

    // answers is like { "growth_q1": "4", "growth_q2": "3", ... }
    const rows = Object.entries(answers).map(([question_code, value]) => ({
      assessment_id,
      question_code,          // assumes your table has question_code
      response_value: Number(value), // assumes numeric 1–5 column
    }));

    const { error } = await supabase
      .from("employer_assessment_responses")
      .insert(rows);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in employer-responses API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
