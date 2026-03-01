import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const method = "GET";

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
        demo: true,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        version: "ME_ORG__CLEAN__V2",
        error: error || "Auth session missing!",
        method,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "ME_ORG__CLEAN__V2__AUTH_OK",
    organisation_id: demoOrgId,
    user_id: user.id,
    demo: false,
  });
}
