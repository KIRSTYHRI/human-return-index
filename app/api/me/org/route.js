import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthUser } from "@/lib/getAuthUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERSION = "ME_ORG__V13__STABLE";

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(req) {
  try {
    const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

    const { user, error } = await getAuthUser(req);

    // 🚨 Not logged in
    if (!user) {
      if (demoOrgId) {
        return NextResponse.json({
          ok: true,
          version: VERSION,
          organisation_id: demoOrgId,
          user_id: null,
          role: "member",
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

    // ✅ Get profile
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

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "Profile not found.",
          user_id: user.id,
        },
        { status: 404 }
      );
    }

    if (!profile.organisation_id) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "No organisation linked to this user profile.",
          user_id: user.id,
          role: profile.role || null,
        },
        { status: 400 }
      );
    }

    // ✅ Success
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
        error: err?.message || "Failed to load user context",
      },
      { status: 500 }
    );
  }
}
