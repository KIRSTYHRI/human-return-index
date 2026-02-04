import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase clients.
 *
 * IMPORTANT:
 * - Never expose admin keys to the browser.
 * - Use supabaseAdmin() ONLY in server code (route handlers / server actions).
 */

// Basic server client (non-admin). Useful for server-side reads that should respect RLS.
export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or publishable/anon key env vars");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Admin server client (privileged). Use ONLY on the server.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or server admin key env vars");
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
