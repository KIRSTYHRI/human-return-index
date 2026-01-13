import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = supabaseServer();

    // 1) Must be logged in
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    // 2) Get this user's organisation_id
    const { data: membership, error: mErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (mErr || !membership?.organisation_id) {
      return NextResponse.json({ ok: false, error: "No organisation assigned to this user" }, { status: 403 });
    }

    const organisation_id = membership.organisation_id;

    // 3) Fetch latest score row for this org
    const { data, error } = await supabase
      .from("hri_scores")
      .select("*")
      .eq("organisation_id", organisation_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, organisation_id, data: data || null }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}
