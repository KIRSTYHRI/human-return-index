import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseFromCookies() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // In route handlers this is allowed; in some server contexts it can throw.
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {}
      },
    },
  });
}

export async function GET() {
  try {
    const supabase = supabaseFromCookies();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      return NextResponse.json({ ok: false, error: "Auth required." }, { status: 401 });
    }

    const user = userData.user;

    // ⚠️ If your table name differs, change it here.
    const { data: orgRow, error: orgError } = await supabase
      .from("user_organisations")
      .select("organisation_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (orgError) {
      return NextResponse.json({ ok: false, error: orgError.message }, { status: 500 });
    }

    if (!orgRow?.organisation_id) {
      return NextResponse.json(
        { ok: false, error: "No organisation linked to this user." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      user_id: user.id,
      organisation_id: orgRow.organisation_id,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
