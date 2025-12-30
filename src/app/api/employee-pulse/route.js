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

    // Expect: { responses: [{ question_id, response_value }] , organisation_id? }
    const responses = Array.isArray(body.responses) ? body.responses : null;
    const organisation_id = body.organisation_id || null;

    if (!responses || responses.length === 0) {
      return NextResponse.json({ ok: false, error: "Missing responses" }, { status: 400 });
    }

    // 1) Create a submission row
    const { data: submission, error: subErr } = await supabase
      .from("pulse_check_submissions")
      .insert([{ organisation_id }])
      .select("id")
      .single();

    if (subErr) {
      return NextResponse.json({ ok: false, error: subErr.message }, { status: 500 });
    }

    const pulse_id = submission.id;

    // 2) Insert responses into hri_pulse_responses
    // We'll try with organisation_id first, then fallback if your table doesn't have that column.
    const rowsWithOrg = responses.map((r) => ({
      pulse_id,
      organisation_id,
      question_id: r.question_id,
      response_value: Number(r.response_value),
    }));

    let ins = await supabase.from("hri_pulse_responses").insert(rowsWithOrg);

    if (ins.error && String(ins.error.message || "").includes("organisation_id")) {
      const rows = responses.map((r) => ({
        pulse_id,
        question_id: r.question_id,
        response_value: Number(r.response_value),
      }));
      ins = await supabase.from("hri_pulse_responses").insert(rows);
    }

    if (ins.error) {
      return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, pulse_id }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
