import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

// Simple UUID generator (no imports needed)
function generatePulseId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

    // 🔑 One pulse_id for this whole submission
    const pulseId = generatePulseId();

    // Build rows for employee_pulse_responses
    const rows = responses.map((r) => ({
      pulse_id: pulseId,                      // 👈 required by your table
      question_id: r.question_id,
      response_value: Number(r.response_value),
      // created_at will use DB default if defined
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
      pulse_id: pulseId,
    });
  } catch (err) {
    console.error("Error in employee pulse API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
