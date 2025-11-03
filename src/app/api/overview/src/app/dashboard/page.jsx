"use client";

export default function Dashboard() {
  return (
    <main style={{ padding: 24 }}>
      <h1>HRI Dashboard</h1>
      <p>✅ Dashboard route is working.</p>
      <p>
        API health: <a href="/api/ok">/api/ok</a> • <a href="/api/db-ping">/api/db-ping</a> •{" "}
        <a href="/api/overview">/api/overview</a>
      </p>
    </main>
  );
}
