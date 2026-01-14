import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;

    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: orgUser, error: orgErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role, user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orgErr) throw orgErr;

    if (!orgUser?.organisation_id) {
      return NextResponse.json(
        { error: "Missing organisation_id", user_id: user.id },
        { status: 404 }
      );
    }

    return NextResponse.json(orgUser);
  } catch (e) {
    return NextResponse.json(
      { error: "me/org failed", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
