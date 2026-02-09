import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const questions = [
  // WELLBEING & MENTAL HEALTH (5)
  { id: "wmh_1", pillar: "WELLBEING & MENTAL HEALTH", text: "Leaders actively role-model healthy boundaries (breaks, realistic deadlines, switching off)." },
  { id: "wmh_2", pillar: "WELLBEING & MENTAL HEALTH", text: "Workload is reviewed regularly and adjusted before people hit burnout." },
  { id: "wmh_3", pillar: "WELLBEING & MENTAL HEALTH", text: "People feel safe to say they’re struggling without fear of consequences." },
  { id: "wmh_4", pillar: "WELLBEING & MENTAL HEALTH", text: "Support is practical and timely (not ‘here’s a link, good luck’)." },
  { id: "wmh_5", pillar: "WELLBEING & MENTAL HEALTH", text: "Managers have the skills to spot early signs of stress and act early." },

  // LEADERSHIP (5)
  { id: "lead_1", pillar: "LEADERSHIP", text: "Managers have clear expectations and the tools to lead consistently." },
  { id: "lead_2", pillar: "LEADERSHIP", text: "Decisions are explained properly, not dropped as surprise grenades." },
  { id: "lead_3", pillar: "LEADERSHIP", text: "Leaders give regular feedback and coaching, not just annual appraisals." },
  { id: "lead_4", pillar: "LEADERSHIP", text: "Leaders address poor behaviour quickly and fairly." },
  { id: "lead_5", pillar: "LEADERSHIP", text: "Leaders create psychological safety (people can challenge, disagree, and learn)." },

  // TRUST & COMMUNICATION (5)
  { id: "tc_1", pillar: "TRUST & COMMUNICATION", text: "Information flows well across teams (no mystery decisions or silence)." },
  { id: "tc_2", pillar: "TRUST & COMMUNICATION", text: "People feel listened to and see follow-through on feedback." },
  { id: "tc_3", pillar: "TRUST & COMMUNICATION", text: "Conflict is handled early and professionally (not avoided)." },
  { id: "tc_4", pillar: "TRUST & COMMUNICATION", text: "Teams communicate clearly on priorities, deadlines, and capacity." },
  { id: "tc_5", pillar: "TRUST & COMMUNICATION", text: "People trust leaders to do what they say they will do." },

  // GROWTH & DEVELOPMENT (5)
  { id: "gd_1", pillar: "GROWTH & DEVELOPMENT", text: "People have clear development paths and opportunities to grow." },
  { id: "gd_2", pillar: "GROWTH & DEVELOPMENT", text: "Learning is supported with time, not just ‘do it in your spare time’." },
  { id: "gd_3", pillar: "GROWTH & DEVELOPMENT", text: "Progression feels fair and transparent." },
  { id: "gd_4", pillar: "GROWTH & DEVELOPMENT", text: "Performance expectations are clear and measured consistently." },
  { id: "gd_5", pillar: "GROWTH & DEVELOPMENT", text: "Managers actively build capability, not just output." },

  // INCLUSION & BELONGING (5)
  { id: "ib_1", pillar: "INCLUSION & BELONGING", text: "People feel they belong and can be themselves at work." },
  { id: "ib_2", pillar: "INCLUSION & BELONGING", text: "Different needs (including neurodiversity) are understood and supported." },
  { id: "ib_3", pillar: "INCLUSION & BELONGING", text: "Bias and unfair behaviour are challenged consistently." },
  { id: "ib_4", pillar: "INCLUSION & BELONGING", text: "People feel respected across levels, teams, and roles." },
  { id: "ib_5", pillar: "INCLUSION & BELONGING", text: "Inclusion is built into how work is designed, not a poster on a wall." },
];

export async function GET() {
  return NextResponse.json({ ok: true, questions });
}
