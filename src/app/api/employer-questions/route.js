import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

export async function GET() {
  try {
    // Pull all employer questions, grouped/sorted nicely
    const { data, error } = await supabase
      .from("employer_questions")
      .select("*")
      .order("pillar", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      questions: data || [],
    });
  } catch (err) {
    console.error("Error in /api/employer-questions:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
