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

    if (!assessment_id || !answers) {
      return NextResponse.json(
        { ok: false, error: "Missing assessment_id or answers" },
        { status: 400 }
      );
    }

    // 1️⃣ Get all employer questions (id + code)
    const { data: questions, error: qErr } = await supabase
      .from("employer_questions")
      .select("id, code");

    if (qErr) {
      return NextResponse.json(
        { ok: false, error: qErr.message },
        { status: 500 }
      );
    }

    // 2️⃣ Build insert rows using UUIDs
    const rows = Object.entries(answers).map(([question_code, value]) => {
      const match = questions.find((q) => q.code === question_code);

      return {
        assessment_id,
        question_id: match ? match.id : null,
        response_value: Number(value),
        response_text: null,
      };
    });

    // 3️⃣ Filter out unmatched codes (just in case)
    const validRows = rows.filter((r) => r.question_id !== null);

    if (validRows.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No matching question IDs found" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("employer_assessment_responses")
      .insert(validRows);

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
