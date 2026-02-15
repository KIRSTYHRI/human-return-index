import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // This refreshes the session cookie so route handlers can read it
  await supabase.auth.getSession();

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
