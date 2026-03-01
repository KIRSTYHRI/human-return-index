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

// Never/Rarely/Sometimes/Often/Always -> 1..5
const MAP = {
  never: 1,
  rarely: 2,
  sometimes: 3,
  often: 4,
  always: 5,
};

function toScore(v) {
  if (typeof v === "number") return v;
  if (!v) return null;
  const k = String(v).trim().toLowerCase();
  return MAP[k] ?? null;
}

export async function POST(req) {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const organisation_id = body?.organisation_id || body?.organization_id || null;
    const responses = Array.isArray(body?.responses) ? body.responses : [];

    if (!organisation_id) {
      return NextResponse.json({ ok: false, error: "Missing organisation_id" }, { status: 400 });
    }
    if (responses.length !== 25) {
      return NextResponse.json(
        { ok: false, error: `Expected 25 responses, got ${responses.length}` },
        { status: 400 }
      );
    }

    // Save raw responses
    // Expect response items: { question_id, response_value } where value is text or 1..5
    const rows = responses.map((r) => ({
      organisation_id,
      question_id: r.question_id,
      response_value: toScore(r.response_value),
    }));

    const { error: insErr } = await supabase.from("employer_assessment_responses").insert(rows);
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

    // Load questions so we can group by pillar (5 questions per pillar)
    const ids = responses.map((r) => r.question_id);
    const { data: qs, error: qErr } = await supabase
      .from("employer_questions")
      .select("id, pillar")
      .in("id", ids);

    if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });

    const pillarMap = {};
    (qs || []).forEach((q) => (pillarMap[q.id] = q.pillar));

    const buckets = {}; // pillar -> [scores]
    for (const r of responses) {
      const p = pillarMap[r.question_id] || "Unknown";
      const s = toScore(r.response_value);
      if (!buckets[p]) buckets[p] = [];
      buckets[p].push(Number(s));
    }

    // Pillar out of 100: average * 20
    const pillarScores = Object.entries(buckets).reduce((acc, [pillar, arr]) => {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      acc[pillar] = avg * 20;
      return acc;
    }, {});

    // Employer score = average of the 5 pillars you use
    const pillarValues = Object.values(pillarScores);
    const employer_score =
      pillarValues.length ? pillarValues.reduce((a, b) => a + b, 0) / pillarValues.length : null;

    // Upsert into hri_scores
    await supabase
      .from("hri_scores")
      .upsert(
        {
          organisation_id,
          employer_score,
          employer_pillar_1: pillarScores["Human-Centred Leadership"] ?? null,
          employer_pillar_2: pillarScores["Wellbeing & Mental Health"] ?? null,
          employer_pillar_3: pillarScores["Inclusion, Safety & Belonging"] ?? null,
          employer_pillar_4: pillarScores["Growth, Learning & Performance"] ?? null,
          employer_pillar_5: pillarScores["Trust, Communication & Clarity"] ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organisation_id" }
      );

    return NextResponse.json(
      { ok: true, employer_score, pillarScores },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}

