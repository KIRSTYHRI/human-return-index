import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "STATIC-TEST",
    message: "If you see this, /api/overview is using the right file.",
    timestamp: new Date().toISOString(),
  });
}
