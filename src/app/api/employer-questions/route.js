import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "supabaseKey is required." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("employer_questions")
    .select("id, pillar, code, question_text, position")
    .order("pillar", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, questions: data || [] }, { status: 200 });
}
