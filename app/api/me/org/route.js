import { NextResponse } from "next/server";
import { supabaseFromBearer } from "../../../../src/lib/supabase/bearerRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  // Debug: do we have a bearer token?
  const authHeader = req.headers.get("authorization") || "";
  console.log("[/api/me/org] auth header present?", !!authHeader);

  // Create supabase client using bearer token
  const { supabase, error } = supabaseFromBearer(req);

  if (error || !supabase) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V7", error: error || "No supabase client" },
      { status: 401 }
    );
  }

  // Confirm user
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return NextResponse.json(
      {
        ok: false,
        version: "ME_ORG_V7",
        error: "Auth user missing",
        details: userErr?.message || null,
      },
      { status: 401 }
    );
  }

  const user = userData.user;

  // ✅ Get organisation_id from profiles table
  // Covers both setups: profiles.id == user.id OR profiles.user_id == user.id
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("organisation_id")
    .or(`id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json(
      {
        ok: false,
        version: "ME_ORG_V7",
        error: "Org lookup failed",
        details: profileErr.message,
      },
      { status: 500 }
    );
  }

  if (!profile?.organisation_id) {
    return NextResponse.json(
      {
        ok: false,
        version: "ME_ORG_V7",
        error: "No organisation_id found for this user",
        user_id: user.id,
      },
      { status: 404 }
    );
  }

  // ✅ Success
  return NextResponse.json({
    ok: true,
    version: "ME_ORG_V7",
    organisation_id: profile.organisation_id,
    user: {
      id: user.id,
      email: user.email,
    },
  });
}
