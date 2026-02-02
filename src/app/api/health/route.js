import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({ ts: new Date().toISOString() });
}
