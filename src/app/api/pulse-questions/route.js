// src/app/api/pulse-questions/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Pulse questions – missing env vars", {
      hasUrl: !!url,
      hasKey: !!key,
    });
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = getServiceSupabase();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase env vars" },
      { status: 500 }
    );
  }

  // IMPORTANT: no "code" column
  const { data, error } = await supabase
    .from("hri_pulse_questions")
    .select("id, pillar, question_text, position")
    .order("pillar", { ascending: true })
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, questions: data || [] }, { status: 200 });
}
