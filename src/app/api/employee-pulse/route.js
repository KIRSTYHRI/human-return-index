import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  try {
    const supabase = getServiceSupabase();
    const body = await req.json();

    const organisation_id = body.organisation_id ?? null;
    const responses = Array.isArray(body.responses) ? body.responses : [];

    if (!responses.length) {
      return NextResponse.json({ ok: false, error: "No responses provided" }, { status: 400 });
    }

    // 1) Create a pulse submission row (pulse_id)
    let pulse_id = null;
    let insertError = null;

    // Try organisation_id
    {
      const { data, error } = await supabase
        .from("pulse_check_submissions")
        .insert({ organisation_id })
        .select("id")
        .single();

      if (!error && data?.id) pulse_id = data.id;
      insertError = error || insertError;
    }

    // Fallback: try org_id
    if (!pulse_id) {
      const { data, error } = await supabase
        .from("pulse_check_submissions")
        .insert({ org_id: organisation_id })
        .select("id")
        .single();

      if (!error && data?.id) pulse_id = data.id;
      insertError = error || insertError;
    }

    // Fallback: insert without org field (if table has neither column)
    if (!pulse_id) {
      const { data, error } = await supabase
        .from("pulse_check_submissions")
        .insert({})
        .select("id")
        .single();

      if (!error && data?.id) pulse_id = data.id;
      insertError = error || insertError;
    }

    if (!pulse_id) {
      return NextResponse.json(
        { ok: false, error: insertError?.message || "Failed to create pulse submission" },
        { status: 500 }
      );
    }

    // 2) Insert responses
    const rows = responses.map((r) => ({
      pulse_id,
      organisation_id, // this MUST match your hri_pulse_responses schema (you said it exists there)
      question_id: r.question_id,
      response_value: Number(r.response_value),
    }));

    const { error: respErr } = await supabase.from("hri_pulse_responses").insert(rows);

    if (respErr) {
      return NextResponse.json({ ok: false, error: respErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pulse_id }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || "Server error" }, { status: 500 });
  }
}
