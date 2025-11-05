"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/overview", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) { setError(j.error || "Error"); return; }
      setOverview(j.overview); setScores(j.scores);
    })();
  }, []);

  if (error) return <main style={{padding:24,color:"crimson"}}>Error: {error}</main>;
  if (!overview) return <main style={{padding:24}}>Loading…</main>;

  return (
    <main>
      <h1>HRI Dashboard</h1>
      <section>
        <div style={{display:"flex", justifyContent:"space-between", gap:16}}>
          <div>
            <div style={{opacity:.6}}>Latest Assessment</div>
            <div style={{fontWeight:700}}>{overview.title}</div>
            <div style={{fontSize:12, opacity:.7}}>
              Status: {overview.status} • Created: {new Date(overview.assessment_created_at).toLocaleDateString()}
            </div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{opacity:.6}}>Badge</div>
            <div style={{fontWeight:700}}>{overview.badge_level ?? "NONE"}</div>
            {overview.badge_awarded_at && (
              <div style={{fontSize:12, opacity:.7}}>
                Awarded: {new Date(overview.badge_awarded_at).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <h3 style={{marginTop:16}}>Pillar Scores</h3>
        <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12}}>
          {scores.map(s => (
            <div key={s.pillar} style={{border:"1px solid #eee", borderRadius:10, padding:12}}>
              <div style={{opacity:.6}}>{s.pillar}</div>
              <div style={{fontSize:24, fontWeight:800}}>{Math.round(s.score)}</div>
            </div>
          ))}
          {scores.length === 0 && <div style={{opacity:.7}}>No scores yet.</div>}
        </div>
      </section>
    </main>
  );
}
