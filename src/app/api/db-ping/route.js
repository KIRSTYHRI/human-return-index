import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Missing Supabase env vars" }, { status: 500 });
  }
  const { data, error } = await supabase.from("organisations").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, found: data?.length ?? 0 });
}
