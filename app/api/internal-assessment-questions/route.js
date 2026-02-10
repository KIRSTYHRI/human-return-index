import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, key, {
    auth: { persistSession: false },
  });

export const dynamic = "force-dynamic";
export const revalidate = 0;

const questions = [
  // WELLBEING & MENTAL HEALTH (5)
  { id: "wmh_1", pillar: "Wellbeing & Mental Health", question_text: "We proactively support mental health, not just react when someone is in crisis.", position: 1 },
  { id: "wmh_2", pillar: "Wellbeing & Mental Health", question_text: "Workload expectations are realistic and don’t rely on people burning out to perform.", position: 2 },
  { id: "wmh_3", pillar: "Wellbeing & Mental Health", question_text: "Managers have the skills to spot early signs of stress and respond appropriately.", position: 3 },
  { id: "wmh_4", pillar: "Wellbeing & Mental Health", question_text: "People feel able to take breaks/leave without guilt or negative consequences.", position: 4 },
  { id: "wmh_5", pillar: "Wellbeing & Mental Health", question_text: "Support pathways are clear, accessible, and trusted (EAP, adjustments, signposting).", position: 5 },

  // GROWTH & DEVELOPMENT (5)
  { id: "gd_1", pillar: "Growth & Development", question_text: "People have clear development pathways and know what good progression looks like here.", position: 1 },
  { id: "gd_2", pillar: "Growth & Development", question_text: "Learning and development is protected time, not an afterthought.", position: 2 },
  { id: "gd_3", pillar: "Growth & Development", question_text: "Performance reviews lead to action and support — not box-ticking.", position: 3 },
  { id: "gd_4", pillar: "Growth & Development", question_text: "People receive regular, useful feedback that helps them improve.", position: 4 },
  { id: "gd_5", pillar: "Growth & Development", question_text: "We invest in leadership development at every level (not just senior leaders).", position: 5 },

  // INCLUSION & BELONGING (5)
  { id: "ib_1", pillar: "Inclusion & Belonging", question_text: "People feel valued and included, regardless of role, background, or working pattern.", position: 1 },
  { id: "ib_2", pillar: "Inclusion & Belonging", question_text: "Policies and practices support neuroinclusion and reasonable adjustments.", position: 2 },
  { id: "ib_3", pillar: "Inclusion & Belonging", question_text: "Different opinions are respected and considered, not shut down.", position: 3 },
  { id: "ib_4", pillar: "Inclusion & Belonging", question_text: "Psychological safety is consistent across teams — not dependent on one ‘good manager’.", position: 4 },
  { id: "ib_5", pillar: "Inclusion & Belonging", question_text: "People feel they can be themselves at work without masking.", position: 5 },

  // TRUST & COMMUNICATION (5)
  { id: "tc_1", pillar: "Trust & Communication", question_text: "Leaders communicate clearly, consistently, and honestly (even when it’s uncomfortable).", position: 1 },
  { id: "tc_2", pillar: "Trust & Communication", question_text: "Employees understand priorities — what matters most and what can wait.", position: 2 },
  { id: "tc_3", pillar: "Trust & Communication", question_text: "Feedback flows both ways and leads to visible change.", position: 3 },
  { id: "tc_4", pillar: "Trust & Communication", question_text: "Conflict is dealt with early and fairly, not ignored until it explodes.", position: 4 },
  { id: "tc_5", pillar: "Trust & Communication", question_text: "People trust decision-making processes are fair and transparent.", position: 5 },

  // LEADERSHIP (5)
  { id: "ld_1", pillar: "Leadership", question_text: "Leaders role-model healthy behaviours (boundaries, breaks, sustainable performance).", position: 1 },
  { id: "ld_2", pillar: "Leadership", question_text: "Managers are confident having wellbeing and performance conversations.", position: 2 },
  { id: "ld_3", pillar: "Leadership", question_text: "Leaders take accountability for culture, not just targets.", position: 3 },
  { id: "ld_4", pillar: "Leadership", question_text: "Leadership decisions consider human impact as well as commercial impact.", position: 4 },
  { id: "ld_5", pillar: "Leadership", question_text: "We act on early warning data (absence, turnover risk, engagement) before it becomes a crisis.", position: 5 },
];

export async function GET() {
  return NextResponse.json({ ok: true, source: "internal-assessment-questions", questions });
(Connect assessment + pulse questions to Supabase)
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("employer_questions")
      .select("id, pillar, question_text, position")
      .order("pillar", { ascending: true })
      .order("position", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      questions: data,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
