import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getUserContext() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthenticated");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, organisation_id, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("Profile not found");
  }

  if (!profile.organisation_id) {
    throw new Error("No organisation linked");
  }

  if (!profile.role) {
    throw new Error("No role assigned");
  }

  return {
    userId: user.id,
    email: user.email || profile.email || null,
    role: profile.role,
    organisationId: profile.organisation_id,
  };
}
