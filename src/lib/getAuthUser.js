import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export async function getAuthUser(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return { supabase: null, user: null, error: "Missing Supabase env vars" };
  }

  // 1) Bearer token (apiFetch)
  const authHeader =
    req?.headers?.get?.("authorization") || req?.headers?.get?.("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const supabase = createClient(supabaseUrl, supabaseAnon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    return { supabase, user: data?.user ?? null, error: error?.message ?? null };
  }

  // 2) Cookie session fallback (prevents dashboard flicker)
  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return req.cookies?.getAll?.() || [];
      },
      setAll() {
        // no-op for GET routes
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  return {
    supabase,
    user: data?.user ?? null,
    error: error?.message ?? "Auth session missing!",
  };
}
