import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/getAuthUser";

const VERSION = "EMPLOYEE_PULSE__V3__DEMO_SAFE";

export async function POST(req) {
  const demoOrgId = process.env.HRI_DEMO_ORG_ID || null;

  const { supabase, user } = await getAuthUser(req);

  const body = await req.json();
  const answers = body?.answers || [];

  if (!answers.length) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "No answers provided." },
      { status: 400 }
    );
  }

  // Determine organisation_id safely
  let organisation_id = null;

  if (user?.organisation_id) {
    organisation_id = user.organisation_id;
  }

  if (!organisation_id && demoOrgId) {
    organisation_id = demoOrgId;
  }

  if (!organisation_id) {
    return NextResponse.json(
      {
        ok: false,
        version: VERSION,
        error: "Missing organisation_id (and no HRI_DEMO_ORG_ID set).",
      },
      { status: 400 }
    );
  }

  if (!supabase) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: "Supabase not available." },
      { status: 500 }
    );
  }

  // Convert array into structured submission
  const submission = {
    organisation_id,
    submitted_at: new Date().toISOString(),
  };

  answers.forEach((a, index) => {
    submission[`q${index + 1}`] = a.value;
  });

  const { error } = await supabase
    .from("pulse_check_submissions")
    .insert(submission);

  if (error) {
    return NextResponse.json(
      { ok: false, version: VERSION, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    version: VERSION,
    demo: !user,
    message: "Pulse submitted successfully.",
  });
}
