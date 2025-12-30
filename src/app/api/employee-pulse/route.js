import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Your org UUID (we'll reuse it everywhere)
const ORG_UUID_FALLBACK = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Don't throw (prevents weird build/runtime failures)
  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req) {
  try {
    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Missing server env vars" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // Front-end might send any of these — we normalise
    const orgUuid =
      body.organisation_id ||
      body.organization_id ||
      body.org_id ||
      ORG_UUID_FALLBACK;

    const responses = Array.isArray(body.responses) ? body.responses : [];
    if (!responses.length) {
      return NextResponse.json(
        { ok: false, error: "No responses provided" },
        { status: 400 }
      );
    }

    // 1) Create pulse submission row
    // IMPORTANT: pulse_check_submissions column is organization_id (TEXT, NOT NULL)
    const { data: sub, error: subErr } = await supabase
      .from("pulse_check_submissions")
      .insert({ organization_id: String(orgUuid) })
      .select("id")
      .single();

    if (subErr || !sub?.id) {
      return NextResponse.json(
        { ok: false, error: subErr?.message || "Failed to create submission" },
        { status: 500 }
      );
    }

    const pulse_id = sub.id;

    // 2) Insert response rows
    // Your hri_pulse_responses table uses organisation_id (UUID)
    const rows = responses.map((r) => ({
      pulse_id,
      organisation_id: orgUuid, // UUID column
      question_id: r.question_id,
      response_value: Number(r.response_value),
    }));

    const { error: respErr } = await supabase
      .from("hri_pulse_responses")
      .insert(rows);

    if (respErr) {
      return NextResponse.json(
        { ok: false, error: respErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, pulse_id }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
