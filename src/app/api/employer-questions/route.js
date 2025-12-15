import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // We accept either name, because you’ve had both in play
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // last resort (not ideal, but prevents crash)

  // DO NOT throw here (ever). Return a clean JSON error.
  if (!url || !key) return { supabase: null, urlOk: !!url, keyOk: !!key };

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  return { supabase, urlOk: true, keyOk: true };
}

export async function GET() {
  const { supabase, urlOk, keyOk } = getSupabase();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase env vars on server",
        debug: {
          hasUrl: urlOk,
          hasRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyOk,
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { data, error } = await supabase
    .from("employer_questions")
    .select("id, pillar, code, question_text, position")
    .order("pillar", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, questions: data || [] },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
