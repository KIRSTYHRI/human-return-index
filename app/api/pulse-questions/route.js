import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUESTIONS = [
  // Growth & Development (2)
  { id: "P1Q1", pillar: "Growth & Development", text: "I have opportunities to learn and grow in my role." },
  { id: "P1Q2", pillar: "Growth & Development", text: "My strengths are used well in my day-to-day work." },

  // Leadership (2)
  { id: "P2Q1", pillar: "Leadership", text: "My manager supports me to do my best work." },
  { id: "P2Q2", pillar: "Leadership", text: "Leadership communicates clearly and follows through." },

  // Trust & Communication (2)
  { id: "P3Q1", pillar: "Trust & Communication", text: "I feel informed about changes that affect my work." },
  { id: "P3Q2", pillar: "Trust & Communication", text: "I can raise concerns without fear of negative consequences." },

  // Wellbeing & Mental Health (2)
  { id: "P4Q1", pillar: "Wellbeing & Mental Health", text: "My workload is manageable most of the time." },
  { id: "P4Q2", pillar: "Wellbeing & Mental Health", text: "I feel able to take breaks and switch off when needed." },

  // Inclusion & Belonging (2)
  { id: "P5Q1", pillar: "Inclusion & Belonging", text: "I feel respected and included at work." },
  { id: "P5Q2", pillar: "Inclusion & Belonging", text: "Different views and backgrounds are valued here." },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    scale: { min: 1, max: 5, labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"] },
    questions: QUESTIONS,
  });
}
