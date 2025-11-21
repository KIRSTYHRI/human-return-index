import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org id we’ve been using
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  try {
    // Get all assessments for this org (latest first)
    const { data, error } = await supabase
      .from("assessments")
      .select("id, title, status, period_start, period_end, created_at, badge_level, badge_awarded_at, is_current")
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      assessments: data || [],
    });
  } catch (err) {
    console.error("Error in GET /api/assessments:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
