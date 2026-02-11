import { NextResponse } from "next/server";
import { supabaseFromBearer } from "../../../lib/supabase/bearerRouteClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req) {
  const auth = req.headers.get("authorization") || "";
  return NextResponse.json({
    ok: true,
    hasAuthHeader: Boolean(auth),
    authPreview: auth ? auth.slice(0, 25) + "..." : null,
  });
}
