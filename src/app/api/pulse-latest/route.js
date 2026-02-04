import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  try {
    const urlObj = new URL(req.url);
    const orgIdParam =
      urlObj.searchParams.get("organisation_id") ||
      urlObj.searchParams.get("organization_id");

    // Fallback mode: allow orgIdParam for testing tools (no login required)
    if (!orgIdParam) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id query param." },
        { status: 400 }
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
          need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"],
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
