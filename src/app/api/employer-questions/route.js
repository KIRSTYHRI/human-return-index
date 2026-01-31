import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = supabaseServer();

    // Questions are generic (not org-specific), so no auth required.
    const { data, error } = await supabase
      .from("employer_questions")
      .select("id, pillar, position, question_text")
      .order("pillar", { ascending: true })
      .order("position", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, questions: data || [] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
