import { NextResponse } from "next/server";

export async function POST(req) {
  const { pass, returnTo = "/dashboard" } = await req.json().catch(() => ({}));
  const real = process.env.DASHBOARD_PASS;
  if (!real) return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  if (!pass || pass !== real) return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });

  const res = NextResponse.json({ ok: true, redirect: returnTo });
  res.cookies.set("hri_pass", real, { path: "/", maxAge: 60 * 60 * 8, sameSite: "lax", secure: true });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("hri_pass", "", { path: "/", maxAge: 0 });
  return res;
}
