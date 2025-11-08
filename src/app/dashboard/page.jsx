"use client";

export default function Dashboard() {
  return (
    <main style={{ padding: 24 }}>
      <h1>HRI Dashboard – Test</h1>
      <p>
        If you can see this page, the <code>/dashboard</code> route is working.
      </p>

      <p style={{ marginTop: 16 }}>
        Now check{" "}
        <a href="/api/overview" style={{ textDecoration: "underline" }}>
          /api/overview
        </a>{" "}
        – it should return some test JSON.
      </p>
    </main>
  );
}
