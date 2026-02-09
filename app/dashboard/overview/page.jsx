"use client";

import CurrentAssessmentCard from "../CurrentAssessmentCard";

export const dynamic = "force-dynamic";

export default function DashboardOverview() {
  return (
    <main>
      <h1 className="pageTitle">Dashboard</h1>
      <p className="pageSub">Your HRI overview — what’s working, what’s risky, and what to fix first.</p>

      <div className="grid2">
        <CurrentAssessmentCard />

        <div className="card">
          <h2 className="cardTitle">Badge</h2>
          <p className="pageSub" style={{ marginTop: 0 }}>
            This is where your badge status will show once the assessment and payment logic is fully wired.
          </p>
          <div className="stat">
            <div className="statLabel">Current badge</div>
            <div className="statValue">No badge yet</div>
          </div>
        </div>
      </div>
    </main>
  );
}
