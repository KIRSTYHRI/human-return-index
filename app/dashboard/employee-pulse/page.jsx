"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

export default function EmployeePulsePage() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [orgId, setOrgId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // Get org
        const orgRes = await apiFetch("/api/me/org");
        const orgJson = await orgRes.json();

        if (!orgRes.ok || !orgJson.organisation_id) {
          throw new Error("No organisation found for this user");
        }

        setOrgId(orgJson.organisation_id);

        // Get questions
        const qRes = await apiFetch("/api/employee-questions");
        const qJson = await qRes.json();

        if (!qRes.ok) throw new Error("Failed loading questions");

        setQuestions(qJson.questions || []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      }
    }

    load();
  }, []);

  function setAnswer(id, val) {
    setAnswers((p) => ({ ...p, [id]: val }));
  }

  async function submit() {
    try {
      if (!orgId) throw new Error("Missing org");

      const payload = {
        organisation_id: orgId,
        answers,
      };

      const res = await apiFetch("/api/employee-pulse/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "Submit failed");

      alert("Pulse submitted ✅");
    } catch (e) {
      alert(e.message);
    }
  }

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!questions.length) return <p>Loading…</p>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Employee Pulse</h1>

      {questions.map((q) => (
        <div key={q.id} style={{ marginBottom: 16 }}>
          <strong>{q.question_text}</strong>

          <div>
            {[1,2,3,4,5].map((v) => (
              <label key={v} style={{ marginRight: 10 }}>
                <input
                  type="radio"
                  name={q.id}
                  value={v}
                  checked={answers[q.id] === v}
                  onChange={() => setAnswer(q.id, v)}
                />
                {v}
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={submit}>Submit</button>
    </div>
  );
}
