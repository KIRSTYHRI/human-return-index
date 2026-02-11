mkdir -p app/dashboard/assessment

cat > app/dashboard/assessment/page.jsx <<'EOF'
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AssessmentRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/hri-assessment");
  }, [router]);

  return null;
}
EOF
