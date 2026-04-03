import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "ME_ORG__V12__PROFILE_LOOKUP";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(req) {
  try {
    const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;
    const { user, error } = await getAuthUser(req);

    if (!user) {
      if (demoOrgId) {
        return NextResponse.json({
          ok: true,
          version: VERSION,
          organisation_id: demoOrgId,
          user_id: null,
          demo: true,
        });
      }

      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: error || "Auth session missing!",
        },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organisation_id, role, full_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: profileError.message,
          user_id: user.id,
        },
        { status: 500 }
      );
    }

    if (!profile?.organisation_id) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "No organisation linked to this user profile.",
          user_id: user.id,
          profile: profile || null,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      organisation_id: profile.organisation_id,
      user_id: user.id,
      role: profile.role || null,
      full_name: profile.full_name || null,
      demo: false,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: err?.message || "Failed to load organisation",
      },
      { status: 500 }
    );
  }
}
