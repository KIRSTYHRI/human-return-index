import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseServer } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
<<<<<<< HEAD
    // 1. Get logged-in user (cookie-based)
=======
    // 1) Get logged-in user (uses cookies)
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
    const supabase = supabaseServer();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const userId = userData.user.id;

<<<<<<< HEAD
    // 2. Find organisation
=======
    // 2) Get user's org
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
    const { data: orgRow, error: orgError } = await supabase
      .from("organisation_users")
      .select("organisation_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (orgError || !orgRow?.organisation_id) {
      return NextResponse.json(
        { ok: false, error: "Missing organisation_id", user_id: userId },
        { status: 400 }
      );
    }

    const organisationId = orgRow.organisation_id;

<<<<<<< HEAD
    // 3. Admin client (SERVICE ROLE)
=======
    // 3) Admin client (service role) to read summary table safely
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing env vars",
<<<<<<< HEAD
=======
          need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

<<<<<<< HEAD
    // 4. Fetch latest pulse
    const { data, error } = await admin
      .from("employee_pulse_summary")
      .select("*")
      .eq(".eq("organization_id", organisationId)
=======
    // 4) IMPORTANT: your table uses `organization_id` (US spelling)
    const { data, error } = await admin
      .from("employee_pulse_summary")
      .select("*")
      .eq("organization_id", organisationId)
>>>>>>> 46ddbd0 (Fix Vercel build: employer-questions import + pulse-latest syntax)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: "Query failed", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      organisation_id: organisationId,
      latest: data ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "pulse-latest crashed", detail: String(err) },
      { status: 500 }
    );
  }
}

