import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!url || !anon) {
    return NextResponse.json({ ok: false, error: "Missing env vars" }, { status: 500 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: "No bearer token provided" }, { status: 401 });
  }

  const supabase = createClient(url, anon, { auth: { persistSession: false } });
  const { data, error } = await supabase.auth.getUser(token);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  return NextResponse.json({ ok: true, user: data.user });
}
