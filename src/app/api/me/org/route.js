import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });

  // 1) Who is logged in?
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
  }

  // 2) Which organisation is this user in?
  const { data, error } = await supabase
    .from("organisation_members")
    .select("organisation_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data?.organisation_id) {
    return NextResponse.json(
      { ok: false, error: "User is not assigned to an organisation" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      user_id: user.id,
      organisation_id: data.organisation_id,
      role: data.role || "member",
    },
    { status: 200 }
  );
}
