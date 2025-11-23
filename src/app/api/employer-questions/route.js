import { NextResponse } from "next/server";
// ⬇️ IMPORTANT: copy your Supabase import/client from db-ping here
// e.g. import { supabase } from "@/lib/supabaseClient";
// or createClient(...) – same as db-ping

export async function GET() {
  try {
    // Adjust this line to match your Supabase client
    const { data, error } = await supabase
      .from("employer_questions")
      .select("id, pillar, code, question_text, position")
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching employer questions:", error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: "employer-questions endpoint",
      questions: data,
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
