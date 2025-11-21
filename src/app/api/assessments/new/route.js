import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) console.warn("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!key) console.warn("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Same org as everywhere else for now
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsLater = new Date(
      now.getFullYear(),
      now.getMonth() + 3,
      1
    );

    const title =
      body.title && String(body.title).trim().length > 0
        ? String(body.title).trim()
        : `HRI Assessment – ${thisMonthStart.toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          })}`;

    const period_start =
      body.period_start ||
      thisMonthStart.toISOString().slice(0, 10); // YYYY-MM-DD
    const period_end =
      body.period_end ||
      threeMonthsLater.toISOString().slice(0, 10); // YYYY-MM-DD

    const status = body.status || "OPEN";

    const { data, error } = await supabase
      .from("assessments")
      .insert({
        organisation_id: ORG_ID,
        title,
        status,
        period_start,
        period_end,
      })
      .select("id, title, status, created_at, period_start, period_end")
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        assessment: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in POST /api/assessments/new:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
