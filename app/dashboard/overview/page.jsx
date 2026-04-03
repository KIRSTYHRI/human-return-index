"use client";

import CurrentAssessmentCard from "../CurrentAssessmentCard";

export const dynamic = "force-dynamic";

export default function DashboardOverview() {
  return (
    <main className="shell">
     <div className="bannerTop">
  Human Return Index™ Dashboard
</div>

<div className="bannerMid">
  <span>LIVE ENVIRONMENT</span>
  <span>HRI — THE NEW KPI FOR HUMAN RETURN</span>
</div>

      <div style={{ marginTop: 16 }}>
        <CurrentAssessmentCard />
      </div>
    </main>
  );
}
