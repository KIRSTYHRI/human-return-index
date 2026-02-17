import { supabaseBrowser } from "./supabaseBrowser";

export async function apiFetch(path, options = {}) {
  const supabase = supabaseBrowser();

  const { data } = await supabase.auth.getSession();
  const accessToken = data?.session?.access_token || null;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  return fetch(path, { ...options, headers, cache: "no-store" });
}
