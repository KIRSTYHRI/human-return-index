import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const { user, error, method } = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
<<<<<<< HEAD
      { ok: false, version: "ME_ORG__V7", error: error || "Auth session missing!", method },
=======
      { ok: false, version: "ME_ORG__V6__BEARER_OK", error: error || "Auth session missing!", method },
>>>>>>> b327506 (fix: dashboard auth via Bearer token (apiFetch) + routes accept bearer or cookie)
      { status: 401 }
    );
  }

<<<<<<< HEAD
  // DEMO fallback (so pulse + assessments always have an org)
  const organisation_id = process.env.HRI_DEMO_ORG_ID || null;

  if (!organisation_id) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG__V7", error: "Missing organisation_id (set HRI_DEMO_ORG_ID)", method },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "ME_ORG__V7",
    organisation_id,
=======
  // If you already map user -> organisation_id in your DB, keep that logic.
  // For now: prove auth works and stop the dashboard flicker.
  return NextResponse.json({
    ok: true,
    version: "ME_ORG__V6__BEARER_OK",
>>>>>>> b327506 (fix: dashboard auth via Bearer token (apiFetch) + routes accept bearer or cookie)
    user_id: user.id,
  });
}
