import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const { user, error, method } = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG__V6__BEARER_OR_COOKIE", error: error || "Auth session missing!", method },
      { status: 401 }
    );
  }

  // If you already have logic to map user -> org, keep it here.
  // For now just prove auth is working:
  return NextResponse.json({
    ok: true,
    version: "ME_ORG__V6__BEARER_OR_COOKIE",
    user_id: user.id,
  });
}
