import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const { user, error } = await getAuthUser(req);
  const method = "GET";

<<<<<<< HEAD
  const { user, error } = await getAuthUser(req);

  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  // ✅ DEMO FALLBACK: return 200 even if no user yet
  if (!user) {
    if (demoOrgId) {
      return NextResponse.json({
        ok: true,
        version: "ME_ORG__CLEAN__V2__DEMO_OK",
        organisation_id: demoOrgId,
        user_id: null,
=======
  // If no auth, use demo org if set (prevents dashboard flip in demo mode)
  if (!user) {
    const organisation_id = process.env.HRI_DEMO_ORG_ID || null;

    if (organisation_id) {
      return NextResponse.json({
        ok: true,
        version: "ME_ORG__V7__DEMO_FALLBACK",
        organisation_id,
>>>>>>> d5402e7 (Fix dashboard flicker permanently)
        demo: true,
      });
    }

    return NextResponse.json(
<<<<<<< HEAD
      {
        ok: false,
        version: "ME_ORG__CLEAN__V2",
        error: error || "Auth session missing!",
        method,
      },
=======
      { ok: false, version: "ME_ORG__V7__NO_AUTH", error: error || "Auth session missing!", method },
>>>>>>> d5402e7 (Fix dashboard flicker permanently)
      { status: 401 }
    );
  }

<<<<<<< HEAD
  return NextResponse.json({
    ok: true,
    version: "ME_ORG__CLEAN__V2__AUTH_OK",
    organisation_id: demoOrgId,
=======
  // ✅ Replace this with your real “user -> org” lookup when ready
  const organisation_id = process.env.HRI_DEMO_ORG_ID || null;

  if (!organisation_id) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG__V7__NO_ORG", error: "Missing organisation_id mapping", method },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "ME_ORG__V7",
    organisation_id,
>>>>>>> d5402e7 (Fix dashboard flicker permanently)
    user_id: user.id,
    demo: false,
  });
}
