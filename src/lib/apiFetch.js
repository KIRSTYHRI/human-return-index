import { supabaseBrowser } from "./supabaseBrowser";

export async function apiFetch(path, options = {}) {
  const { data } = await supabaseBrowser().auth.getSession();
  const access_token = data?.session?.access_token || null;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (access_token) headers.set("Authorization", `Bearer ${access_token}`);

  return fetch(path, { ...options, headers, cache: "no-store" });
}
