import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Next 16/Turbopack runtime: cookieStore.getAll() may not exist.
 * Supabase SSR wants getAll/setAll — we provide a compatible shim.
 */
export function supabaseRouteClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing Supabase env vars");

  // Fallback cookie names used by Supabase auth
  // (project ref may be used in cookie names; we include broad matches)
  const COMMON_COOKIE_NAMES = [
    "sb-access-token",
    "sb-refresh-token",
    "supabase-auth-token",
    "supabase-auth-token-code-verifier",
    "hri-sb-auth", // your storageKey (localStorage) won't be here, but keeping for completeness
  ];

  function safeGetAll() {
    // If getAll exists, use it
    if (typeof cookieStore.getAll === "function") return cookieStore.getAll();

    // Otherwise, attempt to read known cookies by name
    const found = [];
    for (const name of COMMON_COOKIE_NAMES) {
      const c = cookieStore.get(name);
      if (c?.value) found.push({ name, value: c.value });
    }
    return found;
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return safeGetAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // cookieStore.set should exist; guard just in case
          if (typeof cookieStore.set === "function") cookieStore.set(name, value, options);
        });
      },
    },
  });
}
