"use client";

export default function DashboardError({ reset }) {
  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard had a wobble.</h2>
      <p style={{ opacity: 0.8 }}>Hit reload — if it keeps happening, we’ll fix it fast.</p>
      <button onClick={() => reset()}>Reload</button>
    </div>
  );
}
