import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request) {
  const response = NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If env missing, don't brick the whole app
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // only protect dashboard + results
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/results");

  // allow auth-related routes (avoid loops)
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth/callback");

  if (isProtected && !user && !isAuthRoute) {
    const urlObj = request.nextUrl.clone();
    urlObj.pathname = "/login";
    return NextResponse.redirect(urlObj);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/results/:path*"],
};

