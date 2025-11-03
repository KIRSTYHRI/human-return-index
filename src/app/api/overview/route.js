import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Your org id
const ORG_ID = "9499b1b9-7fce-43a1-9590-d533f00dc71d";

export async function GET() {
  const { data: assess, error: aErr } = await supabase
    .from("assessments")
    .select("id,title,status,created_at")
    .eq("organisation_id", ORG_ID)
    .order("created_at", { ascending: false })
    .limit(1);

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });
  if (!assess?.length) return NextResponse.json({ error: "No assessment" }, { status: 404 });

  const latest = assess[0];

  const { data: badge, error: bErr } = await supabase
    .from("badges")
    .select("level,awarded_at")
    .eq("organisation_id", ORG_ID)
    .order("awarded_at", { ascending: false })
    .limit(1);
  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 });

  const { data: scores, error: sErr } = await supabase
    .from("scores")
    .select("pillar,score,assessment_id")
    .eq("assessment_id", latest.id);
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  return NextResponse.json({
    overview: {
      assessment_id: latest.id,
      title: latest.title,
      status: latest.status,
      assessment_created_at: latest.created_at,
      badge_level: badge?.[0]?.level ?? null,
      badge_awarded_at: badge?.[0]?.awarded_at ?? null
    },
    scores: scores ?? []
  });
}
