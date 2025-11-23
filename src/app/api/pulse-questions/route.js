import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("hri_pulse_questions")
      .select("*")
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, questions: data });
  } catch (err) {
    console.error("Pulse questions error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
