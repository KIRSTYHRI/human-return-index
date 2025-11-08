import { NextResponse } from "next/server";

// TEMP: simple test version – no database
export async function GET() {
  return NextResponse.json({
    ok: true,
    overview: {
      assessment_id: "test-assessment",
      title: "Test Assessment",
      status: "OPEN",
      assessment_created_at: new Date().toISOString(),
      period_start: "2025-11-01",
      period_end: "2025-12-01",
      badge_level: "HRI Accredited",
      badge_awarded_at: new Date().toISOString(),
    },
    scores: [
      { pillar: "Leadership", score: 78 },
      { pillar: "Culture", score: 83 },
    ],
  });
}
