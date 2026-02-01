"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const VERSION = "INTERNAL_ASSESSMENT_V3__DB_EMPLOYER_QUESTIONS__25Q__MAP_Q1_25";

// Must match your pillar naming in the DB (yours does)
const PILLAR_ORDER = [
  "Leadership",
  "Wellbeing & Mental Health",
  "Inclusion & Belonging",
  "Growth & Development",
  "Trust & Communication",
];

const SCALE = [
  { v: 1, label: "Strongly disagree" },
  { v: 2, label: "Disagree" },
  { v: 3, label: "Neutral" },
  { v: 4, label: "Agree" },
  { v: 5, label: "Strongly agree" },
];

// 1–5 => 20–100
function toHriScore(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n * 20 : null;
}

export default function InternalAssessmentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]); // 25 ordered
  const [answers, setAnswers] = useState({}); // { q1..q25: 1..5 }

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load employer questions from DB and normalize order to a stable 1..25
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const res = await fetch("/api/employer-questions", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok || json?.ok === false) {
          throw new Error(json?.error || "Failed to load employer questions");
        }

        const raw = Array.isArray(json.questions) ? json.questions : [];

        // Sort by pillar order, then position (1..5). This produces 25 questions.
        const ordered = [];
        for (const pillar of PILLAR_ORDER) {
          const group = raw
            .filter((q) => q.pillar === pillar)
            .sort((a, b) => Number(a.position) - Number(b.position));

          ordered.push(...group);
        }

        if (ordered.length !== 25) {
          console.warn("Expected 25 employer questions, got:", ordered.length);
        }

        setQuestions(ordered);
      } catch (e) {
        setError(e?.message || "Unexpected error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = questions.length;

  const answeredCount = useMemo(() => {
    return Object.values(answers).filter((v) => Number(v) >= 1 && Number(v) <= 5).length;
  }, [answers]);

  const allAnswered = total > 0 && answeredCount === total;

  function setAnswer(idx1to25, val) {
    setAnswers((prev) => ({ ...prev, [`q${idx1to25}`]: val }));
  }

  function buildPillarScoresFromAnswers() {
    // Since we force a stable order of 25:
    // 1-5 Leadership, 6-10 Wellbeing, 11-15 Inclusion, 16-20 Growth, 21-25 Trust
    const buckets = [
      { pillar: "Leadership", qs: [1, 2, 3, 4, 5] },
      { pillar: "Wellbeing & Mental Health", qs: [6, 7, 8, 9, 10] },
      { pillar: "Inclusion & Belonging", qs: [11, 12, 13, 14, 15] },
      { pillar: "Growth & Development", qs: [16, 17, 18, 19, 20] },
      { pillar: "Trust & Communication", qs: [21, 22, 23, 24, 25] },
    ];

    return buckets.map((b) => {
      const vals = b.qs
        .map((q) => toHriScore(answers[`q${q}`]))
        .filter((n) => Number.isFinite(n));

      const avg = vals.length ? vals.reduce((s, n) => s + n, 0) / vals.length : null;

      return {
        pillar: b.pillar,
        score: avg == null ? "" : String(Math.round(avg)),
      };
    });
  }

  async function saveInternalAssessment() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!total) throw new Error("No questions loaded.");
      if (!allAnswered) throw new Error(`Please answer all questions (${answeredCount}/${total}).`);

      // Get org context
      const orgRes = await fetch("/api/me/org", { cache: "no-store" });
      const orgJson = await orgRes.json();

      const organisation_id =
        orgJson?.organisation_id ||
        orgJson?.organization_id ||
        orgJson?.org_id ||
        orgJson?.organisation?.organisation_id ||
        orgJson?.organization?.organization_id ||
        null;

      if (!orgRes.ok || orgJson?.ok === false || !organisation_id) {
        throw new Error(orgJson?.error || "Could not load organisation context.");
      }

      // Create assessment row
      const createRes = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Pilot Baseline Assessment",
          org_id: organisation_id,
        }),
      });

      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok || createJson?.ok === false) {
        throw new Error(createJson?.error || "Failed to create assessment.");
      }

      const assessment_id = createJson?.assessment?.id || null;
      if (!assessment_id) throw new Error("Assessment created but no id returned.");

      // Save pillar scores (0–100) + responses (q1..q25 1–5)
      const scores = buildPillarScoresFromAnswers();

      const saveRes = await fetch(`/api/assessments/${assessment_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, responses: answers }),
      });

      const saveJson = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || saveJson?.ok === false) {
        throw new Error(saveJson?.error || "Failed to save assessment data.");
      }

      // Trigger scoring engine
      const scoreRes = await fetch(`/api/assessment-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment_id }),
      });

      const scoreJson = await scoreRes.json().catch(() => ({}));
      if (!scoreRes.ok || scoreJson?.ok === false) {
        throw new Error(scoreJson?.error || "Saved, but failed to calculate scores.");
      }

      setSuccess(`Saved ✅ Internal assessment created + HRI calculated (Assessment ID: ${assessment_id})`);
      router.push(`/dashboard/assessments/${assessment_id}`);
    } catch (e) {
      setError(e?.message || "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 16px 40px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
        Internal Assessment <span style={{ fontSize: 12, opacity: 0.6 }}>({VERSION})</span>
      </h1>

      <p style={{ opacity: 0
