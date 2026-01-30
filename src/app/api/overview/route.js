import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getLatestAssessment(supabase, organisation_id) {
  const attempts = [
    { table: "hri_assessments", orgCol: "org_id" },
    { table: "hri_assessments", orgCol: "organisation_id" },
    { table: "hri_assessments", orgCol: "organization_id" },

    { table: "assessments", orgCol: "org_id" },
    { table: "assessments", orgCol: "organisation_id" },
    { table: "assessments", orgCol: "organization_id" },
  ];

  const tried = [];

  for (const a of attempts) {
    tried.push(`${a.table}.${a.orgCol}`);

    const { data, error } = await supabase
      .from(a.table)
      .select("id, title, created_at")
      .eq(a.orgCol, organisation_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      continue; // table/column missing or blocked → try next
    }

    if (data?.id) {
      return { assessment: data, source: a, tried };
    }
  }

  return { assessment: null, source: null, tried };
}

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth session missing!" }, { status: 401 });
    }

    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orgErr || !orgRow?.organisation_id) {
      return NextResponse.json(
        { ok: false, error: "No organisation linked to this user." },
        { status: 400 }
      );
    }

    const organisation_id = orgRow.organisation_id;

    const { assessment, source, tried } = await getLatestAssessment(supabase, organisation_id);

    return NextResponse.json({
      ok: true,
      overview: {
        organisation_id,
        assessment_id: assessment?.id || null,
        title: assessment?.title || null,
        period_start: null,
        period_end: null,
        status: assessment?.id ? "draft" : null,
      },
      debug: {
        found: !!assessment?.id,
        source,  // tells us EXACT table/column that worked
        tried,   // shows what it checked
      },
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
