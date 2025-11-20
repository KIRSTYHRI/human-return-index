import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org id we used in /api/overview for now.
// Later this will come from the logged-in user.
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

// GET = list assessments for this org
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("assessments")
      .select(
        "id, title, status, period_start, period_end, created_at"
      )
      .eq("organisation_id", ORG_ID)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, assessments: data ?? [] });
  } catch (err) {
    console.error("GET /api/assessments error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST = create a new assessment cycle
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, period_start, period_end, status } = body || {};

    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const insertData = {
      organisation_id: ORG_ID,
      title,
      status: status || "OPEN",
      period_start: period_start || null,
      period_end: period_end || null,
    };

    const { data, error } = await supabase
      .from("assessments")
      .insert(insertData)
      .select("id, title, status, period_start, period_end, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, assessment: data });
  } catch (err) {
    console.error("POST /api/assessments error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
