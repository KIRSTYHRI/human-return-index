import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const { pathname } = url;

  // Protect these paths
  const protectedPaths = ["/dashboard", "/api/overview"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const cookie = req.cookies.get("hri_pass")?.value;
  const pass = process.env.DASHBOARD_PASS;

  if (cookie && pass && cookie === pass) return NextResponse.next();

  const returnTo = encodeURIComponent(pathname + (url.search || ""));
  const lockUrl = new URL(`/lock?returnTo=${returnTo}`, req.url);
  return NextResponse.redirect(lockUrl);
}

export const config = { matcher: ["/dashboard/:path*", "/api/overview"] };
