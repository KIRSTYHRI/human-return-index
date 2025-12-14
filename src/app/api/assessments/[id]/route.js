import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If you ever see this again, it means Vercel env vars are missing
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key);
}

export async function GET(request, { params }) {
  try {
    const supabase = getServiceSupabase();
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ error: "Missing assessment id" }, { status: 400 });
    }

    // IMPORTANT:
    // This route is only used if your UI still calls /api/assessments/[id]
    // We return from hri_assessments because that's a real table in your schema.
    const { data, error } = await supabase
      .from("hri_assessments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ assessment: data });
  } catch (err) {
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
