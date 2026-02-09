import Link from "next/link";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="shell">
      <div className="hero">
        <div className="brand">
          <div className="logoMark" aria-hidden />
          <div>
            <div className="brandName">Human Return Index™</div>
            <div className="brandTag">People-first KPI for modern organisations</div>
          </div>
        </div>

        <div className="bannerTop">
          DEMO MODE · Experience the Human Return Index™ pilot — built to scale, powered by people.
        </div>

        <h1 className="heroTitle">See the score behind performance.</h1>
        <p className="heroSub">
          Real-time view of how your people are doing — and what that means for performance, risk and ROI.
        </p>

        <div className="ctaRow">
          <Link className="btnPrimary" href="/login">Log in</Link>
          <Link className="btnGhost" href="/dashboard">Go to dashboard</Link>
        </div>

        <div className="bannerMid">
          <span>LIVE PILOT ENVIRONMENT · INTERNAL USE ONLY</span>
          <span>HRI — THE NEW KPI FOR HUMAN RETURN</span>
        </div>
      </div>
    </main>
  );
}
