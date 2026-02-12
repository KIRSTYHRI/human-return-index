import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "EMPLOYER_QUESTIONS_DB_V1";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("employer_questions")
      .select("id,pillar,question_text,position")
      .order("pillar", { ascending: true })
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      { ok: true, version: VERSION, source: "employer_questions", questions: data || [] },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
