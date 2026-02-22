import { supabaseServer } from "./supabaseServer";

/**
 * Reads the logged-in user from Supabase server session (cookie-based).
 * Returns { user, error }
 */
export async function getAuthUser() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user ?? null, error: error ?? null };
  } catch (e) {
    return { user: null, error: e };
  }
}

export default getAuthUser;
