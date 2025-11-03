// src/app/api/ok/route.js
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "HRI",
    timestamp: new Date().toISOString()
  });
}
