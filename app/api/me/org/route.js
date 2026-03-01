import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "ME_ORG__CLEAN__V1";

export async function GET(req) {
  const method = "GET";
  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  // Try auth (token or cookie) but DO NOT crash if missing
  const { user, error } = await getAuthUser(req);

  // Demo fallback for public/demo environments
  if (!user) {
    if (demoOrgId) {
      return NextResponse.json({
        ok: true,
        version: VERSION,
        demo: true,
        organisation_id: demoOrgId,
        user_id: null,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: error || "Auth session missing!",
        method,
        hint: "Set HRI_DEMO_ORG_ID on Vercel (and locally) for demo mode.",
      },
      { status: 401 }
    );
  }

  // Auth OK: for now we still return demoOrgId as the org mapping
  // Replace this later with a real "user -> organisation_id" lookup.
  if (!demoOrgId) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: "Missing HRI_DEMO_ORG_ID (needed until org mapping is implemented).",
        method,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: VERSION,
    demo: false,
    organisation_id: demoOrgId,
    user_id: user.id,
  });
}
