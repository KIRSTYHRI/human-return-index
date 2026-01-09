import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function badge(score) {
  if (score == null) return null;
  if (score >= 75) return "HRI Accredited Plus";
  if (score >= 60) return "HRI Accredited";
  return "HRI Certified";
}

export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const organisation_id = searchParams.get("organisation_id");
  if (!organisation_id) {
    return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hri_scores")
    .select("*")
    .eq("organisation_id", organisation_id)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const employer = data?.employer_score ?? null;
  const employee = data?.employee_score ?? null;

  // 50/50 only when both exist
  const hri_score =
    employer != null && employee != null
      ? (Number(employer) * 0.5) + (Number(employee) * 0.5)
      : (employer ?? employee);

  const finalBadge = badge(hri_score);

  // save back
  await supabase
    .from("hri_scores")
    .upsert(
      {
        organisation_id,
        hri_score,
        badge: finalBadge,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "organisation_id" }
    );

  return NextResponse.json({ ok: true, hri_score, employer, employee, badge: finalBadge }, { status: 200 });
}
