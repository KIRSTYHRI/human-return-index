import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = supabaseServer();
 const { data, error } = await admin
  .from("employee_pulse_summary")
  .select("*")
  .eq("organization_id", organisationId)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();


    if (orgError || !orgRow?.organisation_id) {
      return NextResponse.json({ ok: false, error: "No organisation linked to this user." }, { status: 400 });
    }

    const organisationId = orgRow.organisation_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing env vars",
          need: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
        },
        { status: 500 }
      );
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await admin
      .from("employee_pulse_summary")
      .select("*")
      .eq("organization_id", String(organisationId))
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      organisation_id: organisationId,
      latest: data || null,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
