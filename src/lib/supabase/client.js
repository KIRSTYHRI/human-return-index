import { createClient } from "@supabase/supabase-js";

let browserClient;

export function supabaseBrowser() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  browserClient = createClient(url, anon, {
    auth: {
      persistSession: true,
      storageKey: "hri-auth",
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
