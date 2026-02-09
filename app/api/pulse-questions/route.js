import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

// 2 from each pillar = 10
const questions = [
  { id: "p_wmh_1", pillar: "WELLBEING & MENTAL HEALTH", text: "In the past 2 weeks, my workload has felt manageable." },
  { id: "p_wmh_2", pillar: "WELLBEING & MENTAL HEALTH", text: "I feel supported when I’m under pressure." },

  { id: "p_lead_1", pillar: "LEADERSHIP", text: "My manager communicates expectations clearly." },
  { id: "p_lead_2", pillar: "LEADERSHIP", text: "Leadership decisions feel fair and well explained." },

  { id: "p_tc_1", pillar: "TRUST & COMMUNICATION", text: "I feel comfortable speaking up with ideas or concerns." },
  { id: "p_tc_2", pillar: "TRUST & COMMUNICATION", text: "Important information is shared in time for me to do my job well." },

  { id: "p_gd_1", pillar: "GROWTH & DEVELOPMENT", text: "I have opportunities to learn and develop in my role." },
  { id: "p_gd_2", pillar: "GROWTH & DEVELOPMENT", text: "I receive useful feedback that helps me improve." },

  { id: "p_ib_1", pillar: "INCLUSION & BELONGING", text: "I feel I belong and I’m respected at work." },
  { id: "p_ib_2", pillar: "INCLUSION & BELONGING", text: "My needs are understood and reasonably supported." },
];

export async function GET() {
  return NextResponse.json({ ok: true, questions });
}
