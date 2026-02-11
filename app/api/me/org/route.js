import { supabaseFromBearer } from "../../../../src/lib/supabase/bearerRouteClient";

export const dynamic = "force-dynamic";

export async function GET(req) {
  // Debug: prove header arrived
  const authHeader = req.headers.get("authorization") || "";
  console.log("[/api/me/org] auth header present?", !!authHeader);
  console.log("[/api/me/org] auth header starts:", authHeader.slice(0, 20));

  const { supabase, error } = supabaseFromBearer(req);

  if (error || !supabase) {
    return Response.json(
      { ok: false, version: "ME_ORG_V5", error: error || "No supabase client" },
      { status: 401 }
    );
  }

  // Confirm user
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return Response.json(
      { ok: false, version: "ME_ORG_V5", error: "Auth user missing", details: userErr?.message || null },
      { status: 401 }
    );
  }

  const user = userData.user;

  // ORG LOOKUP (assumes profiles table contains organisation_id)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("organisation_id")
    .eq("id", user.id)
    .single();

  if (profileErr) {
    return Response.json(
      {
        ok: false,
        version: "ME_ORG_V5",
        error: "Org lookup failed (profiles table).",
        details: profileErr.message,
      },
      { status: 500 }
    );
  }

  if (!profile?.organisation_id) {
    return Response.json(
      {
        ok: false,
        version: "ME_ORG_V5",
        error: "No organisation_id found for this user.",
        user_id: user.id,
      },
      { status: 404 }
    );
  }

  return Response.json({
    ok: true,
    version: "ME_ORG_V5",
    organisation_id: profile.organisation_id,
    user: { id: user.id, email: user.email },
  });
}
