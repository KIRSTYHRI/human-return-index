import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function POST(req) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { responses } = body || {};

    if (!Array.isArray(responses) || responses.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No responses submitted" },
        { status: 400 }
      );
    }

    // Build rows for employee_pulse_responses
    const rows = responses.map((r) => ({
      question_id: r.question_id,
      response_value: Number(r.response_value),
      // created_at will default in the DB if the column exists with a default
    }));

    const { error } = await supabase
      .from("employee_pulse_responses")
      .insert(rows);

    if (error) {
      console.error("Error inserting employee pulse responses:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: rows.length,
    });
  } catch (err) {
    console.error("Error in employee pulse API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
