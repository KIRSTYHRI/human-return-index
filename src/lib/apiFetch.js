"use client";

import { supabaseBrowser } from "./supabase/browser";

export async function apiFetch(path, options = {}) {
  const supabase = supabaseBrowser();

  // Get session from Supabase (in-browser)
  const { data, error } = await supabase.auth.getSession();
  const session = data?.session || null;
  const token = session?.access_token || null;

  // Helpful debug (remove later if you want)
  console.log("[apiFetch] path:", path);
  console.log("[apiFetch] session exists?", !!session);
  console.log("[apiFetch] token exists?", !!token);

  if (error) console.log("[apiFetch] getSession error:", error);

  // Build headers
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Only set JSON content type if not already set
  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Make request
  return fetch(path, {
    ...options,
    headers,
    cache: "no-store",
    credentials: "include",
  });
}
