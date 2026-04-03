import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "ME_ORG__V11__DEMO_OK";

export async function GET(req) {
  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;
  const { user, error } = await getAuthUser(req);

  if (!user) {
    if (demoOrgId) {
      return NextResponse.json({
        ok: true,
        version: VERSION,
        organisation_id: demoOrgId,
        user_id: null,
        demo: true,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: error || "Auth session missing!",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: VERSION,
    organisation_id: demoOrgId,
    user_id: user.id,
    demo: false,
  });
}
