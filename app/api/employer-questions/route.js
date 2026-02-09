import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUESTIONS = [
  // Growth & Development (5)
  { id: "E1", pillar: "Growth & Development", text: "We have clear development pathways and progression options." },
  { id: "E2", pillar: "Growth & Development", text: "Managers regularly discuss growth and performance development." },
  { id: "E3", pillar: "Growth & Development", text: "Learning time/budget is protected, not just ‘nice to have’." },
  { id: "E4", pillar: "Growth & Development", text: "We track capability gaps and plan upskilling proactively." },
  { id: "E5", pillar: "Growth & Development", text: "Feedback is consistent, useful, and leads to action." },

  // Leadership (5)
  { id: "E6", pillar: "Leadership", text: "Leaders model the behaviours expected across the business." },
  { id: "E7", pillar: "Leadership", text: "Managers are trained to lead people (not just manage tasks)." },
  { id: "E8", pillar: "Leadership", text: "Performance expectations are clear and fair." },
  { id: "E9", pillar: "Leadership", text: "Leaders are visible, accountable, and trusted." },
  { id: "E10", pillar: "Leadership", text: "We handle poor management behaviour quickly and consistently." },

  // Trust & Communication (5)
  { id: "E11", pillar: "Trust & Communication", text: "We communicate change early, clearly, and consistently." },
  { id: "E12", pillar: "Trust & Communication", text: "People feel safe to speak up and challenge decisions." },
  { id: "E13", pillar: "Trust & Communication", text: "We measure and act on psychological safety signals." },
  { id: "E14", pillar: "Trust & Communication", text: "Conflict is managed well and doesn’t get ignored." },
  { id: "E15", pillar: "Trust & Communication", text: "We have reliable routes for raising concerns and getting outcomes." },

  // Wellbeing & Mental Health (5)
  { id: "E16", pillar: "Wellbeing & Mental Health", text: "Workload and resourcing are reviewed before burnout happens." },
  { id: "E17", pillar: "Wellbeing & Mental Health", text: "Managers can spot early signs of stress and act appropriately." },
  { id: "E18", pillar: "Wellbeing & Mental Health", text: "Absence is handled supportively and consistently." },
  { id: "E19", pillar: "Wellbeing & Mental Health", text: "We have prevention in place, not just crisis support." },
  { id: "E20", pillar: "Wellbeing & Mental Health", text: "Wellbeing is treated as a business performance driver." },

  // Inclusion & Belonging (5)
  { id: "E21", pillar: "Inclusion & Belonging", text: "Our culture is inclusive in practice, not just policy." },
  { id: "E22", pillar: "Inclusion & Belonging", text: "We make work accessible for different needs and ways of working." },
  { id: "E23", pillar: "Inclusion & Belonging", text: "Leaders role-model inclusive language and behaviour." },
  { id: "E24", pillar: "Inclusion & Belonging", text: "We act on culture risks (cliques, bias, exclusion) quickly." },
  { id: "E25", pillar: "Inclusion & Belonging", text: "People feel they belong and can be themselves at work." },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    scale: { min: 1, max: 5, labels: ["Not at all", "Rarely", "Sometimes", "Mostly", "Fully"] },
    questions: QUESTIONS,
  });
}
