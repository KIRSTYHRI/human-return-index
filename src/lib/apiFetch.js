import { supabaseBrowser } from "./supabaseBrowser";

// Supports BOTH import styles:
//   import apiFetch from "..."
//   import { apiFetch } from "..."
export default async function apiFetch(path, options = {}) {
  const opts = { ...(options || {}) };
  const headers = new Headers(opts.headers || {});

  try {
    // Try to attach the user token if logged in
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch (e) {
    // If anything fails, still allow the request to run
  }

  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  opts.headers = headers;
  return fetch(path, opts);
}

export { apiFetch };
