import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // NOTE: no "position" column here – we just order by pillar + code
    const { data, error } = await supabase
      .from("hri_pulse_questions")
      .select("*")
      .order("pillar", { ascending: true })
      .order("code", { ascending: true });

    if (error) {
      console.error("Pulse questions error:", error);
      return NextResponse.json({
        ok: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      ok: true,
      source: "pulse-questions endpoint",
      count: data?.length || 0,
      questions: data || [],
    });
  } catch (err) {
    console.error("Fatal pulse questions error:", err);
    return NextResponse.json({
      ok: false,
      error: err.message || "Unexpected failure in pulse-questions route",
    });
  }
}
