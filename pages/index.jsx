import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Human Return Index™ ✅</h1>
      <p>Your deployment is live again. Use the links below:</p>
      <ul>
        <li><Link href="/login">Go to Login</Link></li>
        <li><Link href="/dashboard">Go to Dashboard</Link></li>
      </ul>
    </main>
  );
}
