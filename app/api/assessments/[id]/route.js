import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ASSESSMENTS_ID_V2__SAVE_RESPONSES__RETURN_SCORES_DISPLAY_NAMES";

const PILLAR_LABELS = {
  pillar_1: "Leadership",
  pillar_2: "Wellbeing & Mental Health",
  pillar_3: "Inclusion & Belonging",
  pillar_4: "Growth & Development",
  pillar_5: "Trust & Communication",
};

// Turn stored pillar_scores into [{ pillar: "Leadership", score: 60 }, ...]
function normalizeScores(pillar_scores) {
  const obj = pillar_scores && typeof pillar_scores === "object" ? pillar_scores : {};
  const out = [];

  // If keys are pillar_1..pillar_5
  const hasInternalKeys = Object.keys(obj).some((k) => k.startsWith("pillar_"));
  if (hasInternalKeys) {
    for (const [k, label] of Object.entries(PILLAR_LABELS)) {
      if (k in obj) out.push({ pillar: label, score: obj[k] == null ? null : Number(obj[k]) });
    }
    return out;
  }

  // Otherwise assume keys are already display labels
  for (const [k, v] of Object.entries(obj)) {
    out.push({ pillar: k, score: v == null ? null : Number(v) });
  }
  return out;
}

export async function GET(_req, { params }) {
  try {
    const supabase = supabaseServer(req);
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Missing id" }, { status: 400 });
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Auth session missing!" }, { status: 401 });
    }

    // Get org for this user
    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orgErr || !orgRow?.organisation_id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "No organisation linked to this user." }, { status: 400 });
    }

    // Fetch assessment (RLS applies)
    const { data: row, error } = await supabase
      .from("hri_assessments")
      .select("id, org_id, title, created_at, overall_score, pillar_scores, responses")
      .eq("id", id)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, version: VERSION, error: error.message }, { status: 500 });
    if (!row?.id) return NextResponse.json({ ok: false, version: VERSION, error: "Assessment not found" }, { status: 404 });

    // Extra safety: org match (prevents cross-org leakage even if RLS is relaxed)
    if (row.org_id !== orgRow.organisation_id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Forbidden (org mismatch)" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      assessment: {
        id: row.id,
        org_id: row.org_id,
        title: row.title,
        created_at: row.created_at,
        status: "draft",
        // your UI currently references these fields, so keep them present
        period_start: "",
        period_end: "",
        is_current: false,
        badge_level: null,
        badge_awarded_at: null,
        overall_score: row.overall_score ?? null,
      },
      scores: normalizeScores(row.pillar_scores),
      // helpful for debugging (safe because it’s your org)
      responses_count: row.responses && typeof row.responses === "object" ? Object.keys(row.responses).length : 0,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, version: VERSION, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const supabase = supabaseServer(req);
    const id = params?.id;

    if (!id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Missing id" }, { status: 400 });
    }

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Auth session missing!" }, { status: 401 });
    }

    // Get org for this user
    const { data: orgRow, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (orgErr || !orgRow?.organisation_id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "No organisation linked to this user." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const scores = Array.isArray(body?.scores) ? body.scores : [];
    const responses = body?.responses && typeof body.responses === "object" ? body.responses : null;

    // Convert scores array into an object (store as display labels, OR keep existing if blank)
    const pillar_scores = {};
    for (const row of scores) {
      const pillar = row?.pillar;
      const scoreNum = Number(row?.score);
      if (!pillar) continue;
      pillar_scores[pillar] = Number.isFinite(scoreNum) ? scoreNum : null;
    }

    const updatePayload = {
      // always allow saving pillar scores (even if some are null)
      pillar_scores,
    };

    // ✅ Save responses if provided
    if (responses) {
      updatePayload.responses = responses;
    }

    // Update the row (RLS applies)
    const { data: updated, error: upErr } = await supabase
      .from("hri_assessments")
      .update(updatePayload)
      .eq("id", id)
      .select("id, org_id, title, created_at, overall_score, pillar_scores, responses")
      .maybeSingle();

    if (upErr) return NextResponse.json({ ok: false, version: VERSION, error: upErr.message }, { status: 500 });
    if (!updated?.id) return NextResponse.json({ ok: false, version: VERSION, error: "Update failed" }, { status: 500 });

    // Extra safety check
    if (updated.org_id !== orgRow.organisation_id) {
      return NextResponse.json({ ok: false, version: VERSION, error: "Forbidden (org mismatch)" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      assessment: {
        id: updated.id,
        org_id: updated.org_id,
        title: updated.title,
        created_at: updated.created_at,
        status: "draft",
        period_start: "",
        period_end: "",
        is_current: false,
        badge_level: null,
        badge_awarded_at: null,
        overall_score: updated.overall_score ?? null,
      },
      scores: normalizeScores(updated.pillar_scores),
      responses_count: updated.responses && typeof updated.responses === "object" ? Object.keys(updated.responses).length : 0,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, version: VERSION, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

