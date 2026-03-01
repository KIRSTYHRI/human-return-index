import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
<<<<<<< HEAD
  const method = "GET";

  const { user, error } = await getAuthUser(req);

  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  // ✅ DEMO FALLBACK: return 200 even if no user yet
  if (!user) {
    if (demoOrgId) {
      return NextResponse.json({
        ok: true,
        version: "OVERVIEW__V7__DEMO_OK",
        user_id: null,
        organisation_id: demoOrgId,
        demo: true,
=======
  const { user, error } = await getAuthUser(req);

  const organisation_id = process.env.HRI_DEMO_ORG_ID || null;

  // If no auth, allow DEMO (prevents dashboard flicker)
  if (!user) {
    if (organisation_id) {
      return NextResponse.json({
        ok: true,
        version: "OVERVIEW__V7__DEMO_FALLBACK",
        demo: true,
        organisation_id,
        metrics: {
          hri_score: 72,
          risk_level: "Medium",
          absenteeism_risk: "Moderate",
          turnover_risk: "Moderate",
          presenteeism_risk: "High",
        },
>>>>>>> d5402e7 (Fix dashboard flicker permanently)
      });
    }

    return NextResponse.json(
<<<<<<< HEAD
      {
        ok: false,
        version: "OVERVIEW__V7",
        error: error || "Auth session missing!",
        method,
      },
=======
      { ok: false, version: "OVERVIEW__V7__NO_AUTH", error: error || "Auth session missing!" },
>>>>>>> d5402e7 (Fix dashboard flicker permanently)
      { status: 401 }
    );
  }

<<<<<<< HEAD
  return NextResponse.json({
    ok: true,
    version: "OVERVIEW__V7__AUTH_OK",
    user_id: user.id,
    organisation_id: demoOrgId,
    demo: false,
=======
  // Replace with real org metrics lookup later:
  if (!organisation_id) {
    return NextResponse.json(
      { ok: false, version: "OVERVIEW__V7__NO_ORG", error: "Missing org id mapping" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "OVERVIEW__V7",
    organisation_id,
    user_id: user.id,
    metrics: {
      hri_score: 72,
      risk_level: "Medium",
      absenteeism_risk: "Moderate",
      turnover_risk: "Moderate",
      presenteeism_risk: "High",
    },
>>>>>>> d5402e7 (Fix dashboard flicker permanently)
  });
}
