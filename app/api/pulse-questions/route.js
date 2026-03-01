import { NextResponse } from "next/server";

/**
 * Employee Pulse Questions
 * Source of truth for the pulse form.
 * If these were changed, this is where it happened.
 *
 * NOTE: You can edit the text safely — keep IDs stable.
 */
const questions = [
  // WELLBEING & MENTAL HEALTH
  { id: "p_wmh_1", pillar: "WELLBEING & MENTAL HEALTH", text: "My workload is manageable most of the time." },
  { id: "p_wmh_2", pillar: "WELLBEING & MENTAL HEALTH", text: "I feel supported when I’m under pressure." },

  // LEADERSHIP
  { id: "p_lead_1", pillar: "LEADERSHIP", text: "My manager sets clear expectations and supports me to succeed." },
  { id: "p_lead_2", pillar: "LEADERSHIP", text: "Leaders communicate decisions clearly and fairly." },

  // TRUST & COMMUNICATION
  { id: "p_tc_1", pillar: "TRUST & COMMUNICATION", text: "I feel comfortable speaking up with ideas or concerns." },
  { id: "p_tc_2", pillar: "TRUST & COMMUNICATION", text: "Information that affects my work is shared in a timely way." },

  // GROWTH & DEVELOPMENT
  { id: "p_gd_1", pillar: "GROWTH & DEVELOPMENT", text: "I have opportunities to learn and develop in my role." },
  { id: "p_gd_2", pillar: "GROWTH & DEVELOPMENT", text: "My strengths are recognised and used well." },

  // INCLUSION & BELONGING
  { id: "p_ib_1", pillar: "INCLUSION & BELONGING", text: "I feel I belong and I’m respected at work." },
  { id: "p_ib_2", pillar: "INCLUSION & BELONGING", text: "Different perspectives are valued in my team." },
];

export async function GET() {
  return NextResponse.json({ ok: true, questions });
}
