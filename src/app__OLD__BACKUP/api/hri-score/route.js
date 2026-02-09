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

// GET /api/hri-score?organisation_id=...
export async function GET(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const organisation_id =
    searchParams.get("organisation_id") ||
    searchParams.get("organization_id") ||
    null;

  if (!organisation_id) {
    return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hri_scores")
    .select("*")
    .eq("organisation_id", String(organisation_id))
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { ok: true, organisation_id, data: data?.[0] || null },
    { status: 200 }
  );
}
