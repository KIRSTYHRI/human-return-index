import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    // For now, we just echo back what we received.
    // Step 2 will save this into Supabase (employee_pulse_responses).
    console.log("Employee pulse submission:", body);

    if (!body || !Array.isArray(body.responses) || body.responses.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No responses submitted" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error in employee pulse API:", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
