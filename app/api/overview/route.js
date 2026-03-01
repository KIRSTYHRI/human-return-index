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
        version: "OVERVIEW__V7__DEMO_OK",
        user_id: null,
        organisation_id: demoOrgId,
        demo: true,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        version: "OVERVIEW__V7",
        error: error || "Auth session missing!",
        method,
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "OVERVIEW__V7__AUTH_OK",
    user_id: user.id,
    organisation_id: demoOrgId,
    demo: false,
  });
}
