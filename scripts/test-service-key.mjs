import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("ENV CHECK:", {
  hasUrl: !!url,
  hasServiceKey: !!serviceKey,
});

if (!url || !serviceKey) {
  console.log("❌ Missing env vars");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const { data, error } = await admin
  .from("organisations")
  .select("id")
  .limit(1);

if (error) {
  console.log("❌ SERVICE KEY FAIL:", error.message);
  process.exit(1);
}

console.log("✅ SERVICE KEY OK — organisations readable:", data);

