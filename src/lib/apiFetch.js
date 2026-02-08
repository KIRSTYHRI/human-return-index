import { supabaseBrowser } from "./supabase/client";

// Fetch helper that always attaches the logged-in user's token
export async function apiFetch(path, options = {}) {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(path, {
    ...options,
    headers,
    cache: "no-store",
  });
}
