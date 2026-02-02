import { NextResponse } from "next/server";

export function ok(data, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message, code = "UNKNOWN", status = 400, meta) {
  return NextResponse.json(
    { ok: false, error: { message, code, ...(meta ? { meta } : {}) } },
    { status }
  );
}
