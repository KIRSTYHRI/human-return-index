import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "OVERVIEW__V10__DEMO_OK";

export async function GET(req) {
  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  const { user, error } = await getAuthUser(req);

  // Demo fallback
  if (!user) {
    if (demoOrgId) {
      return NextResponse.json({
        ok: true,
        version: VERSION,
        demo: true,
        organisation_id: demoOrgId,
        user_id: null,
        overview: {
          overall_score: null,
          latest_assessment: null,
          pillar_scores: null,
          badge: null,
        },
      });
    }

    return NextResponse.json(
      { ok: false, version: VERSION, error: error || "Auth session missing!" },
      { status: 401 }
    );
  }

  // Auth OK (replace with real overview query when ready)
  return NextResponse.json({
    ok: true,
    version: VERSION,
    demo: false,
    organisation_id: demoOrgId,
    user_id: user.id,
    overview: {
      overall_score: null,
      latest_assessment: null,
      pillar_scores: null,
      badge: null,
    },
  });
}
