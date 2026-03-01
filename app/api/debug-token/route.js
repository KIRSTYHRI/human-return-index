import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

export async function GET(req) {
  const authHeader =
    req.headers.get("authorization") || req.headers.get("Authorization");

  const hasAuthHeader = !!authHeader;
  const authPreview = authHeader ? authHeader.slice(0, 18) + "…" : null;

  const hasCookie =
    (req.cookies?.getAll?.() || []).length > 0;

  const { user, error } = await getAuthUser(req);

  return NextResponse.json({
    ok: true,
    version: "DEBUG_TOKEN__V3",
    hasAuthHeader,
    authPreview,
    hasAnyCookies: hasCookie,
    cookieNames: (req.cookies?.getAll?.() || []).map(c => c.name),
    hasCookieUser: !!user,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userError: error ?? null,
    demoOrg: process.env.HRI_DEMO_ORG_ID || null,
  });
}
