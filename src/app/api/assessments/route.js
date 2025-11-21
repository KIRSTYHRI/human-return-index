import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org id we’ve used everywhere
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("assessments")
      .select(
        "id, title, status, created_at, period_start, period_end, badge_level, badge_awarded_at"
      )
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, assessments: data || [] });
  } catch (err) {
    console.error("Error in GET /api/assessments:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
