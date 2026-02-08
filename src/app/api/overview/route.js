import { NextResponse } from "next/server";
import { supabaseRouteClient } from "../../../lib/supabase/routeClient";

const VERSION = "overview-v1";

export async function GET() {
  const supabase = supabaseRouteClient();

  const { data: userData, error: userErr } = await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Auth session missing!" },
      { status: 401 }
    );
  }

  // ...rest of your logic stays the same
}
