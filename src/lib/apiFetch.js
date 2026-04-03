import { supabaseBrowser } from "./supabaseBrowser";

// Supports BOTH:
//   import apiFetch from "..."
//   import { apiFetch } from "..."
async function apiFetch(path, options = {}) {
  const opts = { ...(options || {}) };
  const headers = new Headers(opts.headers || {});

  // always include cookies if available
  if (!opts.credentials) opts.credentials = "include";

  try {
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.warn("apiFetch getSession error:", error.message);
    }

    const token = data?.session?.access_token;

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch (err) {
    console.warn("apiFetch auth header fallback:", err?.message || err);
  }

  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  opts.headers = headers;
  return fetch(path, opts);
}

export default apiFetch;
export { apiFetch };
