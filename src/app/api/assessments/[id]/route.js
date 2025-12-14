import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request, { params }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or URL missing in env");
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing assessment id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("hri_assessments")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assessment: data });
}

