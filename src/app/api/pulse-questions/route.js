// src/app/api/pulse-questions/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("Pulse questions – missing Supabase env vars", {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
    });
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Supabase configuration missing on server. Check env vars in Vercel.",
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("hri_pulse_questions")
      .select("id, pillar, question_text, position")
      .order("position", { ascending: true });

    if (error) {
      console.error("Pulse questions DB error:", error);
      throw error;
    }

    return NextResponse.json({
      ok: true,
      questions: data || [],
    });
  } catch (err) {
    console.error("Pulse questions route error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to load pulse questions",
      },
      { status: 500 }
    );
  }
}
