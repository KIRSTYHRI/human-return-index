import { createClient } from "@supabase/supabase-js";

export function supabaseFromBearer(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing Supabase env vars");

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) return { supabase: null, token: null };

  const supabase = createClient(url, anon, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  return { supabase, token };
}
