
import { NextResponse } from "next/server";

export function middleware(req) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // If not set, don't block (avoids locking you out by accident)
  if (!user || !pass) return NextResponse.next();

  const auth = req.headers.get("authorization");

  if (!auth) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="HRI Pilot"' },
    });
  }

  const [scheme, encoded] = auth.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return new NextResponse("Invalid authentication", { status: 401 });
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const [u, p] = decoded.split(":");

  if (u === user && p === pass) return NextResponse.next();

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="HRI Pilot"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
