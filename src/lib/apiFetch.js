import { supabaseBrowser } from "./supabaseBrowser";

// Supports BOTH:
//   import apiFetch from "..."
//   import { apiFetch } from "..."
async function apiFetch(path, options = {}) {
  const opts = { ...(options || {}) };
  const headers = new Headers(opts.headers || {});

  try {
    const { data } = await supabaseBrowser?.auth?.getSession?.();
    const token = data?.session?.access_token;

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch (_) {
    // allow request without auth header
  }

  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  opts.headers = headers;
  return fetch(path, opts);
}

export default apiFetch;
export { apiFetch };
