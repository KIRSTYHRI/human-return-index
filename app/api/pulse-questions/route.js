import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VERSION = "PULSE_QUESTIONS__V3__DB_PUBLIC";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("hri_pulse_questions")
    .select("id, pillar, question_text, position")
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: error.message },
      { status: 500 }
    );
  }

  const questions = (data || []).map((q) => ({
    id: q.id,
    pillar: q.pillar,
    text: q.question_text,
    position: q.position,
  }));

  return NextResponse.json({ ok: true, version: VERSION, questions });
}
