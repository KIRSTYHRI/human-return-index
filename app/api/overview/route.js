import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const { user, error, method } = await getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { ok: false, version: "OVERVIEW__V6__BEARER_OK", error: error || "Auth session missing!", method },
      { status: 401 }
    );
  }

  // Return whatever your dashboard expects. Keep it simple for now.
  return NextResponse.json({
    ok: true,
    version: "OVERVIEW__V6__BEARER_OK",
    user_id: user.id,
    demo: true,
  });
}
