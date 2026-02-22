import { createClient } from "@supabase/supabase-js";

// Route-handler helper that supports:
// 1) Bearer token via Authorization header (apiFetch)
// 2) Cookie session (optional) - but simplest reliable path is Bearer for local testing
export async function getAuthUser(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return { supabase: null, user: null, error: "Missing Supabase env vars" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Try Bearer first
  const authHeader = req?.headers?.get?.("authorization") || req?.headers?.get?.("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    const { data, error } = await supabase.auth.getUser(token);
    return { supabase, user: data?.user ?? null, error: error?.message ?? null };
  }

  // No Bearer token present
  return { supabase, user: null, error: "Auth session missing!" };
}
