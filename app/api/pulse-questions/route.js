import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "PULSE_QUESTIONS__V2__DB";

export async function GET(req) {
  const { supabase } = await getAuthUser(req);

  if (!supabase) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Supabase client not available" },
      { status: 500 }
    );
  }

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

  // Normalize to what your UI expects: { id, pillar, text }
  const questions = (data || []).map((q) => ({
    id: q.id,
    pillar: q.pillar,
    text: q.question_text,
    position: q.position,
  }));

  return NextResponse.json({ ok: true, version: VERSION, questions });
}
