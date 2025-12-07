// src/app/dashboard/hri-assessment/page.jsx
"use client";

import AssessmentPage from "../assessments/page";

/**
 * HRI Internal Assessment
 *
 * This page simply reuses the full 25-question employer assessment
 * that already lives at /dashboard/assessments.
 */
export default function HriAssessmentPage() {
  return <AssessmentPage />;
}
