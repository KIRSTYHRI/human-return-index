"use client";

import CurrentAssessmentCard from "../CurrentAssessmentCard";

export const dynamic = "force-dynamic";

export default function DashboardOverview() {
  return (
    <main className="shell">
      <div className="bannerTop">
        DEMO MODE · Experience the Human Return Index™ pilot — built to scale, powered by people.
      </div>

      <div className="bannerMid">
        <span>LIVE PILOT ENVIRONMENT · INTERNAL USE ONLY</span>
        <span>HRI — THE NEW KPI FOR HUMAN RETURN</span>
      </div>

      <div style={{ marginTop: 16 }}>
        <CurrentAssessmentCard />
      </div>
    </main>
  );
}
