import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data, error } = await supabase
      .from("employer_questions")
      .select("*")
      .order("pillar", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      console.error("Employer questions error:", error);
      return NextResponse.json({ ok: false, error: error.message });
    }

    return NextResponse.json({
      ok: true,
      count: data.length,
      questions: data,
    });
  } catch (err) {
    console.error("Fatal error:", err);
    return NextResponse.json({
      ok: false,
      error: err.message || "Unexpected failure",
    });
  }
}
