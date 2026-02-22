import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const { user, error, method } = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG__V7", error: error || "Auth session missing!", method },
      { status: 401 }
    );
  }

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
    user_id: user.id,
  });
}
