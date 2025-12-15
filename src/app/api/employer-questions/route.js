import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(
    { marker: "EMPLOYER_QUESTIONS_SRC_ROUTE_LIVE_V1" },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
