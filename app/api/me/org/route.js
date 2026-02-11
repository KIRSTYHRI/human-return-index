import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "ME_ORG__V1__RELATIVE_IMPORTS";

export async function GET() {
  try {
    const supabase = supabaseServer();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    const { data: row, error } = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, version: VERSION, error: error.message }, { status: 500 });
    }

    if (!row?.organisation_id) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "No organisation linked to this user." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, version: VERSION, organisation_id: row.organisation_id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
