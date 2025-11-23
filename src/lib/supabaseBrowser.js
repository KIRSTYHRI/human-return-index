// src/lib/supabaseBrowser.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Basic safety log if envs are missing (so it doesn't silently fail)
if (!url || !anonKey) {
  console.warn(
    "Supabase browser client is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabaseBrowser =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
        },
      })
    : null;
