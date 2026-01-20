import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json(
        { ok: false, error: "Missing org_id" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing env vars",
          need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Pull latest employer responses for this org, and get pillar from employer_questions
    // NOTE: If your org column is "organization_id" (US spelling), we handle that below by trying both.
    let rows = null;

    // Try organisation_id first
    let q = await admin
      .from("employer_assessment_responses")
      .select(
        `
        id,
        assessment_id,
        question_id,
        response_value,
        created_at,
        employer_questions (
          id,
          pillar,
          pillar_id,
          pillar_name
        )
      `
      )
      .eq("organisation_id", orgId)
      .order("created_at", { ascending: false })
      .limit(500);

    if (q.error) {
      // If organisation_id column doesn't exist, try organization_id
      q = await admin
        .from("employer_assessment_responses")
        .select(
          `
          id,
          assessment_id,
          question_id,
          response_value,
          created_at,
          employer_questions (
            id,
            pillar,
            pillar_id,
            pillar_name
          )
        `
        )
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(500);
    }

    if (q.error) {
      return NextResponse.json(
        { ok: false, error: "Query failed", detail: q.error.message },
        { status: 500 }
      );
    }

    rows = q.data || [];

    // If there are no responses yet
    if (!rows.length) {
      return NextResponse.json({ ok: true, org_id: orgId, employer: null });
    }

    // Group by pillar (whatever column exists on employer_questions)
    const byPillar = {};
    for (const r of rows) {
      const qn = r.employer_questions || {};
      const pillar =
        qn.pillar ?? qn.pillar_name ?? qn.pillar_id ?? "unknown";

      const val = Number(r.response_value);
      if (Number.isNaN(val)) continue;

      if (!byPillar[pillar]) byPillar[pillar] = [];
      byPillar[pillar].push(val);
    }

    const pillarScores = Object.entries(byPillar).map(([pillar, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { pillar, average: Math.round(avg * 100) / 100, count: vals.length };
    });

    const overall =
      pillarScores.reduce((a, p) => a + p.average, 0) / pillarScores.length;

    return NextResponse.json({
      ok: true,
      org_id: orgId,
      employer: {
        overall: Math.round(overall * 100) / 100,
        pillars: pillarScores,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Results Engine failed", detail: String(err) },
      { status: 500 }
    );
  }
}
