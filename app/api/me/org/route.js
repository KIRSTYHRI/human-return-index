import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseFromBearer } from "../../../../src/lib/supabase/bearerRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  // 1) Confirm user via bearer token (auth)
  const { supabase, error } = supabaseFromBearer(req);

  if (error || !supabase) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V8", error: error || "No supabase client" },
      { status: 401 }
    );
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V8", error: "Auth user missing", details: userErr?.message || null },
      { status: 401 }
    );
  }

  const user = userData.user;

  // 2) Look up org using SERVICE ROLE (bypasses RLS safely on server)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return NextResponse.json(
      {
        ok: false,
        version: "ME_ORG_V8",
        error: "Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
      },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(url, serviceKey);

  const { data: profile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("organisation_id")
    .or(`id.eq.${user.id},user_id.eq.${user.id}`)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V8", error: "Org lookup failed", details: profileErr.message },
      { status: 500 }
    );
  }

  if (!profile?.organisation_id) {
    return NextResponse.json(
      { ok: false, version: "ME_ORG_V8", error: "No organisation_id found for this user", user_id: user.id },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: "ME_ORG_V8",
    organisation_id: profile.organisation_id,
    user: { id: user.id, email: user.email },
  });
}
