// src/app/api/assessment-scores/route.js

export const dynamic = "force-dynamic";

const jsonHeaders = { "Content-Type": "application/json" };

/**
 * POST /api/assessment-scores
 *
 * Expects:
 * {
 *   answers: [
 *     {
 *       question_id: string,
 *       pillar: string,
 *       score1to5: number,   // 1–5
 *       score100: number     // 0–100
 *     },
 *     ...
 *   ],
 *   meta?: {
 *     assessment_id?: string,
 *     organisation_id?: string,
 *     period_start?: string,
 *     period_end?: string
 *   }
 * }
 *
 * For now: calculates per-pillar + overall scores in-memory and returns them.
 * Later: we can plug this into Supabase to persist.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { answers, meta = {} } = body || {};

    if (!Array.isArray(answers) || answers.length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "No answers provided. Expected an array of answers[].",
        }),
        { status: 400, headers: jsonHeaders }
      );
    }

    // Group 0–100 scores by pillar
    const byPillar = new Map();

    for (const a of answers) {
      if (!a) continue;
      const pillar = a.pillar || "Unknown pillar";
      const score100 = Number(a.score100 ?? (Number(a.score1to5) / 5) * 100);

      if (!Number.isFinite(score100)) continue;

      if (!byPillar.has(pillar)) {
        byPillar.set(pillar, []);
      }
      byPillar.get(pillar).push(score100);
    }

    const pillarScores = [];
    let total = 0;
    let count = 0;

    for (const [pillar, values] of byPillar.entries()) {
      if (!values.length) continue;
      const avg =
        values.reduce((sum, v) => sum + v, 0) / values.length;
      const rounded = Math.round(avg);
      pillarScores.push({ pillar, score: rounded });
      total += rounded;
      count += 1;
    }

    const overallScore = count > 0 ? Math.round(total / count) : null;

    const result = {
      ok: true,
      overallScore,
      pillarScores,
      meta,
    };

    // 🔜 Later: write `result` into Supabase here.

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (err) {
    console.error("assessment-scores POST error:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Failed to process assessment scores",
      }),
      { status: 500, headers: jsonHeaders }
    );
  }
}

/**
 * Simple health check so you can hit this in the browser.
 */
export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      message:
        "assessment-scores API is live. POST answers[] to calculate scores.",
    }),
    { status: 200, headers: jsonHeaders }
  );
}
