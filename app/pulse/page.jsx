import { Suspense } from "react";
import PublicPulseClient from "./PublicPulseClient";

export const dynamic = "force-dynamic";

export default function PulsePage() {
  return (
    <Suspense
      fallback={
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
          <p>Loading pulse page…</p>
        </main>
      }
    >
      <PublicPulseClient />
    </Suspense>
  );
}
