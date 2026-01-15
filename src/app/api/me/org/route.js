import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function supabaseFromCookies() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );
}

export async function GET() {
  try {
    const supabase = supabaseFromCookies();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr) throw userErr;

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user_id = user.id;

    // 1) Try organisation_users
    let { data: link, error: linkErr } = await supabase
      .from("organisation_users")
      .select("organisation_id, role, user_id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (linkErr) {
      // If table doesn't exist / RLS blocks, ignore and try the next
      link = null;
    }

    // 2) Fallback: organisation_members (some builds use this instead)
    if (!link) {
      const { data: link2, error: link2Err } = await supabase
        .from("organisation_members")
        .select("organisation_id, role, user_id")
        .eq("user_id", user_id)
        .maybeSingle();

      if (!link2Err) link = link2 || null;
    }

    if (!link?.organisation_id) {
      return NextResponse.json(
        { error: "Missing organisation_id", user_id },
        { status: 404 }
      );
    }

    return NextResponse.json({
      organisation_id: link.organisation_id,
      role: link.role || "member",
      user_id,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
