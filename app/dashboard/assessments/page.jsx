"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssessmentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/hri-assessment");
  }, [router]);

  return (
    <div style={{ padding: 40 }}>
      Redirecting to the HRI assessment…
    </div>
  );
}
