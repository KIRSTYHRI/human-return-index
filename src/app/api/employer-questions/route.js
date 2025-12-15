import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // THIS IS THE PROOF MARKER
  const marker = "EMPLOYER_QUESTIONS_SRC_ROUTE_V2";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env missing, return debug (don’t crash)
  if (!url || !key) {
    return NextResponse.json(
      {
        ok: false,
        marker,
        error: "Missing env vars inside employer-questions route",
        debug: {
          hasUrl: !!url,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        },
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Create client ONLY after env checks
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("employer_questions")
    .select("id, pillar, code, question_text, position")
    .order("pillar", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, marker, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, marker, count: data?.length || 0, questions: data || [] },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
