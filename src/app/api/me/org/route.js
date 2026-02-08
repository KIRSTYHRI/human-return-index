import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const VERSION = "ME_ORG_V1";

export async function GET(req) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) throw new Error("Missing Supabase env vars");

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Missing Bearer token" },
        { status: 401 }
      );
    }

    const supabase = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    // ✅ pass token directly
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: userErr?.message || "Auth session missing!" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      user_id: userData.user.id,
      email: userData.user.email,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
