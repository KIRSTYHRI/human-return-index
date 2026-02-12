export const dynamic = "force-dynamic";

export async function GET() {
  // NEVER return full keys. Only show whether they exist.
  const pick = (name) => ({
    exists: !!process.env[name],
    preview: process.env[name] ? `${process.env[name].slice(0, 6)}…` : null,
  });

  return Response.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    supabaseUrl: pick("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnon: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    serviceRole: pick("SUPABASE_SERVICE_ROLE_KEY"),
  });
}
