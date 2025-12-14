import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key);
}

// POST /api/assessments/new
// Creates a new assessment record
export async function POST(request) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    // Minimal validation (keep it simple)
    // You can expand this later
    const title = body?.title || "HRI Assessment";
    const org_id = body?.org_id || body?.organisation_id || null;

    // If you don't have org_id wired yet, we still allow creation
    const insertPayload = {
      title,
      org_id,
      pillar_scores: body?.pillar_scores || {},
      overall_score: body?.overall_score ?? null,
    };

    const { data, error } = await supabase
      .from("hri_assessments")
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assessment: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
