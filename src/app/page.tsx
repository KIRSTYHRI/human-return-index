// src/app/page.tsx
export default function Home() {
  return (
    <main>
      <h1>Human Return Index™</h1>
      <p>
        Health: <a href="/api/ok">/api/ok</a> • DB: <a href="/api/db-ping">/api/db-ping</a>
      </p>
      <p>Dashboard: <a href="/dashboard">/dashboard</a></p>
    </main>
  );
}
