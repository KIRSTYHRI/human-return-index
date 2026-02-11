"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/apiFetch";

export const dynamic = "force-dynamic";

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [orgId, setOrgId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        setDebug(null);

        // MUST include Bearer token, so use apiFetch
        const orgRes = await apiFetch("/api/me/org");
        const orgJson = await orgRes.json().catch(() => null);

        if (!orgRes.ok || orgJson?.ok === false) {
          setDebug({ where: "org-missing", orgJson });
          throw new Error(orgJson?.error || "Failed to load /api/me/org");
        }

        if (!orgJson?.organisation_id) {
          setDebug({ where: "org-no-id", orgJson });
          throw new Error("Missing organisation_id from /api/me/org (see debug).");
        }

        setOrgId(orgJson.organisation_id);

        const qRes = await apiFetch("/api/employee-questions");
        const qJson = await qRes.json().catch(() => null);

        if (!qRes.ok || qJson?.ok === false) {
          throw new Error(qJson?.error || "Failed to load employee questions");
        }

        setQuestions(Array.isArray(qJson?.questions) ? qJson.questions : []);
      } catch (e) {
        console.error(e);
        setError(e?.message || "Failed to load.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: Number(value) }));
  }

  const questionsCount = questions.length;

  async function submitPulse() {
    try {
      setSubmitting(true);
      setError("");

      if (!orgId) throw new Error("Missing organisation_id (org not loaded).");
      if (!questionsCount) throw new Error("No questions loaded.");

      const res = await apiFetch("/api/employee-pulse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organisation_id: orgId, answers }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || (json && json.ok === false)) {
        throw new Error((json && json.error) || "Failed to submit pulse");
      }

      alert("Pulse submitted ✅");
    } catch (e) {
      console.error(e);
      setError(e?.message || "Failed to submit pulse");
    } finally {
      setSubmitting(false);
    }
  }

 
