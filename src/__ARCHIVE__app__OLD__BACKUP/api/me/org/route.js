import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const VERSION = "ME_ORG_V2";

function supabaseFromCookie() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      // GET route: we don't need to set cookies here
      setAll() {},
    },
  });
}

function supabaseFromBearer(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anon) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;

  if (!token) return null;

  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

async function findOrgId(supabase, userId) {
  // Try common membership tables (use whichever exists in your DB)
  const tries = [
    { table: "organisation_members", colUser: "user_id", colOrg: "organisation_id" },
    { table: "organisation_users", colUser: "user_id", colOrg: "organisation_id" },
  ];

  for (const t of tries) {
    const { data, error } = await supabase
      .from(t.table)
      .select(t.colOrg)
      .eq(t.colUser, userId)
      .limit(1)
      .maybeSingle();

    if (!error && data?.[t.colOrg]) return data[t.colOrg];
  }

  return null;
}

export async function GET(req) {
  try {
    // Prefer bearer if provided, otherwise cookie session
    const supabase = supabaseFromBearer(req) || supabaseFromCookie();

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const user = userData?.user;

    if (userErr || !user) {
      return NextResponse.json(
        { ok: false, version: VERSION, error: "Auth session missing!" },
        { status: 401 }
      );
    }

    const organisation_id = await findOrgId(supabase, user.id);

    if (!organisation_id) {
      return NextResponse.json(
        {
          ok: false,
          version: VERSION,
          error: "No organisation found for this user",
          user_id: user.id,
          email: user.email,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      version: VERSION,
      organisation_id,
      user_id: user.id,
      email: user.email,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
