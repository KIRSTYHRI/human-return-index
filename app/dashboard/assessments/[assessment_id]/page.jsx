"use client";

import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AssessmentDetailPage() {
  const params = useParams();
  const assessmentId = params?.assessment_id;

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Assessment Saved ✅</h1>
      <p style={{ opacity: 0.8 }}>
        Assessment ID: <strong>{assessmentId}</strong>
      </p>
      <p style={{ opacity: 0.75, marginTop: 12 }}>
        This is a placeholder page so you don’t hit a 404.
        Next step: display saved pillar scores + responses here.
      </p>
    </main>
  );
}
