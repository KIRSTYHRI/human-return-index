import { supabaseFromBearer } from "@/src/lib/supabase/bearerRouteClient";

export const dynamic = "force-dynamic";

export async function GET(req) {
  // Debug: prove header arrived
  const authHeader = req.headers.get("authorization") || "";
  console.log("[/api/me/org] auth header present?", !!authHeader);
  console.log("[/api/me/org] auth header starts:", authHeader.slice(0, 20));

  const { supabase, error } = supabaseFromBearer(req);

  if (error || !supabase) {
    return Response.json(
      { ok: false, version: "ME_ORG_V4", error: error || "No supabase client" },
      { status: 401 }
    );
  }

  // 1) Confirm user
  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return Response.json(
      { ok: false, version: "ME_ORG_V4", error: "Auth user missing", details: userErr?.message || null },
      { status: 401 }
    );
  }

  const user = userData.user;

  // 2) TEMP response (just to prove token works end-to-end)
  // Once this works, we’ll add your org lookup logic back in.
  return Response.json({
    ok: true,
    version: "ME_ORG_V4",
    user: {
      id: user.id,
      email: user.email,
    },
    note: "Bearer token received + user verified. Next: org lookup.",
  });
}
