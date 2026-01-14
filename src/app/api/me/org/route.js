import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseServer();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organisation_users")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  return NextResponse.json({
    user_id: user.id,
    organisation_id: membership?.organisation_id ?? null,
    role: membership?.role ?? null,
  });
}
