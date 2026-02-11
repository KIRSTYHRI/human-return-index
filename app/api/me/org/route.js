import { NextResponse } from "next/server";
import { supabaseFromBearer } from "../../../../src/lib/supabase/bearerRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const authHeader = req.headers.get("authorization") || "";
  console.log("[/api/me/org] auth header present?", !!authHeader);

  const { supabase, error } = supabaseFromBearer(req);

  if (error || !supabase) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V6", error: error || "No supabase client" },
      { status: 401 }
    );
  }

  // Confirm user
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V6", error: "Auth user missing", details: userErr?.message || null },
      { status: 401 }
    );
  }

  const user = userData.user;

  // Org lookup (assumes profiles table has organisation_id)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (profileErr) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V6", error: "Org lookup failed", details: profileErr.message },
      { status: 500 }
    );
  }

  if (!profile?.organisation_id) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V6", error: "No organisation_id found for this user", user_id: user.id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "ME_ORG_V6",
    organisation_id: profile.organisation_id,
    user: { id: user.id, email: user.email },
  });
}
