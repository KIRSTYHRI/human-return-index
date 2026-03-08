import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing server env vars" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const org_id = searchParams.get("org_id");

    let q = supabase
      .from("hri_assessments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (org_id) q = q.eq("org_id", org_id);

    const { data, error } = await q;

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, assessments: data || [] }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing server env vars" }, { status: 500 });
  }

  try {
    const body = await request.json();

    const title = body?.title || "HRI Assessment";
    const org_id = body?.org_id || body?.organisation_id || null;

    const responses =
      (body?.responses && typeof body.responses === "object" && body.responses) ||
      (body?.answersObject && typeof body.answersObject === "object" && body.answersObject) ||
      {};

    const { data, error } = await supabase
      .from("hri_assessments")
      .insert({
        title,
        org_id,
        responses,
        pillar_scores: body?.pillar_scores || {},
        overall_score: body?.overall_score ?? null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (org_id) {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        new URL(request.url).origin;

      await fetch(
        `${baseUrl}/api/calculate-hri?organisation_id=${org_id}`,
        { method: "GET", cache: "no-store" }
      );
    }

    return NextResponse.json({ ok: true, assessment: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err?.message || "Internal server error" }, { status: 500 });
  }
}
