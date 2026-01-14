import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = cookies();

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anon) {
      return NextResponse.json(
        { error: "Missing env vars", need: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"] },
        { status: 500 }
      );
    }

    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 401 });
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data: orgUserRow, error: orgUserErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (orgUserErr) return NextResponse.json({ error: orgUserErr.message }, { status: 500 });

    if (!orgUserRow?.organisation_id) {
      return NextResponse.json(
        { error: "Missing organisation_id", user_id: user.id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organisation_id: orgUserRow.organisation_id,
      role: orgUserRow.role || "member",
      user_id: user.id,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

