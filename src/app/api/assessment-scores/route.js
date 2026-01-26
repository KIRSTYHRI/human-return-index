import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth session missing!" }, { status: 401 });
    }

    const url = new URL(req.url);
    const assessment_id = url.searchParams.get("assessment_id");
    if (!assessment_id) {
      return NextResponse.json({ ok: false, error: "Missing assessment_id" }, { status: 400 });
    }

    // Pull pillar scores for this assessment (adjust table name/columns if needed)
    const { data, error } = await supabase
      .from("scores") // << if your pillar score table is different, tell me its name
      .select("pillar, score")
      .eq("assessment_id", assessment_id)
      .order("pillar", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, scores: data || [] });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
