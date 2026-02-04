import { createBrowserClient } from "@supabase/ssr";

// Next will inline NEXT_PUBLIC_* at build time.
// We read them once at module load, not inside the function.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function supabaseBrowser() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    // Make it impossible to fail silently
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (check .env.local and restart dev server)"
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
}
