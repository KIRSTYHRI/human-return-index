import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

// Supports BOTH cookie-based auth (browser) and Bearer token (apiFetch)
export async function GET(req) {
  const method = "GET";

  const { supabase, user, error } = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG__CLEAN__V1", error: error || "Auth session missing!", method },
      { status: 401 }
    );
  }

  // If you have a mapping table, fetch org id here.
  // For now we support a demo org id for your pilot environment.
  const organisation_id = process.env.HRI_DEMO_ORG_ID || null;

  return NextResponse.json({
    ok: true,
    version: "ME_ORG__CLEAN__V1",
    organisation_id,
    user_id: user.id,
  });
}
