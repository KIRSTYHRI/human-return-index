import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  // IMPORTANT: do not throw here (build must not crash)
  if (!url || !key) return null;

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase server env vars" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id") || searchParams.get("organisation_id");

  if (!orgId) {
    return NextResponse.json(
      { ok: false, error: "Missing org_id" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  // Minimal, safe query (adjust later once stable)
  const { data, error } = await supabase
    .from("scores")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    { ok: true, score: data?.[0] || null },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
