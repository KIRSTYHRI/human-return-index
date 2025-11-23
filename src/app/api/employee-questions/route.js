// src/app/api/employee-questions/route.js
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "employee-questions endpoint",
    questions: [
      {
        id: "growth_q1",
        pillar: "Growth & Development",
        question_text:
          "Employees have clear opportunities for career development and growth",
        position: 1,
      },
      {
        id: "growth_q2",
        pillar: "Growth & Development",
        question_text:
          "Our organization invests in training and skill development programs",
        position: 2,
      },
      {
        id: "growth_q3",
        pillar: "Growth & Development",
        question_text:
          "Employees receive useful feedback to help them improve and grow",
        position: 3,
      },
    ],
  });
}
