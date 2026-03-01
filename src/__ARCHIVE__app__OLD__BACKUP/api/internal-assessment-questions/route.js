// src/app/api/internal-assessment-questions/route.js

export async function GET() {
  // For now this is static. Later we’ll swap to Supabase.
  const questions = [
    {
      id: "q1",
      pillar: "Leadership & Culture",
      question_text:
        "Leaders in our organisation role-model healthy, human-centred behaviours.",
    },
    {
      id: "q2",
      pillar: "Workload & Burnout Risk",
      question_text:
        "People can do their jobs to a high standard without sacrificing their health or life outside work.",
    },
    {
      id: "q3",
      pillar: "Psychological Safety",
      question_text:
        "People feel safe to speak up about mistakes, pressure and mental health without fear of judgement.",
    },
    {
      id: "q4",
      pillar: "Growth & Development",
      question_text:
        "We invest consistently in people’s skills, development and long-term growth.",
    },
    {
      id: "q5",
      pillar: "Support & Connection",
      question_text:
        "People feel supported by their manager and connected to their team, even when work is busy.",
    },
  ];

  return new Response(JSON.stringify({ ok: true, questions }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
