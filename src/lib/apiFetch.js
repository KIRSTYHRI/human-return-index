"use client";

import { supabaseBrowser } from "./supabase/browser";

export async function apiFetch(path, options = {}) {
  const supabase = supabaseBrowser();

  // Get the current session (fast + local)
  const { data: { session }, error } = await supabase.auth.getSession();

  const token = session?.access_token;

  // Debug (remove later)
  console.log("[apiFetch] session?", !!session);
  console.log("[apiFetch] token?", token ? `${token.slice(0, 12)}...` : null);
  if (error) console.log("[apiFetch] getSession error:", error);

  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", headers.get("Content-Type") || "application/json");

  return fetch(path, {
    ...options,
    headers,
    // Not required for bearer, but harmless and helps if you later add cookie auth
    credentials: "include",
    cache: "no-store",
  });
}
