import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const urlObj = new URL(req.url);
    const orgIdParam =
      urlObj.searchParams.get("organisation_id") ||
      urlObj.searchParams.get("organization_id");

    // 1) Session-aware client (reads auth cookies)
    const supabase = createRouteHandlerClient({ cookies });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If logged in, derive organisation_id from your mapping table
    if (user && !userError) {
      const { data: orgRow, error: orgError } = await supabase
        .from("user_organisations") // <-- change to YOUR actual table name
        .select("organisation_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const organisationId = orgRow?.organisation_id;

      if (orgError || !organisationId) {
        return NextResponse.json(
          { ok: false, error: "No organisation linked to this user." },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("employee_pulse_summary")
        .select("*")
        .eq("organization_id", String(organisationId))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        organisation_id: organisationId,
        latest: data || null,
      });
    }

    // 2) No session: production guardrail
    // In production we do NOT allow org_id fallback (prevents "anyone with an org UUID can pull data")
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { ok: false, error: "Auth required." },
        { status: 401 }
      );
    }

    // 3) No session (dev/preview only): allow fallback for testing if org id provided
    if (!orgIdParam) {
      return NextResponse.json(
        { ok: false, error: "Auth session missing (and no organisation_id provided)." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !adminKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing env vars",
          need: [
            "NEXT_PUBLIC_SUPABASE_URL",
            "SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)",
          ],
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await admin
      .from("employee_pulse_summary")
      .select("*")
      .eq("organization_id", String(orgIdParam))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      organisation_id: String(orgIdParam),
      latest: data || null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
