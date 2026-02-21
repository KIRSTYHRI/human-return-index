import { NextResponse } from "next/server";
import { supabaseServer } from "../../../src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VERSION = "DEBUG_TOKEN__V2__HEADER_PLUS_COOKIE";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization") || null;

    const supabase = supabaseServer(req);
    const { data, error } = await supabase.auth.getUser();

    return NextResponse.json({
      ok: true,
      version: VERSION,
      hasAuthHeader: !!auth,
      authPreview: auth ? `${auth.slice(0, 20)}…` : null,
      hasCookieUser: !!data?.user,
      userId: data?.user?.id || null,
      userError: error?.message || null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
