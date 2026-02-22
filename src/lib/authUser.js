import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "./supabaseServer";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getAuthUser(req) {
  // 1) Bearer token (client auth)
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice("Bearer ".length).trim();

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data?.user) return { user: data.user, method: "bearer" };

    return { user: null, method: "bearer", error: error?.message || "Invalid token" };
  }

  // 2) Cookie session (server auth)
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) return { user: data.user, method: "cookie" };

    return { user: null, method: "cookie", error: error?.message || "Auth session missing!" };
  } catch {
    return { user: null, method: "cookie", error: "Auth session missing!" };
  }
}
