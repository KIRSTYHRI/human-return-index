"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function LockPage() {
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const sp = useSearchParams();
  const router = useRouter();
  const returnTo = sp.get("returnTo") || "/dashboard";

  async function unlock(e) {
    e.preventDefault();
    setErr("");
    const r = await fetch("/api/unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pass, returnTo }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) router.replace(j.redirect || returnTo);
    else setErr(j.error || "Incorrect passcode");
  }

  return (
    <main style={{maxWidth:420, margin:"8vh auto", padding:"2rem",
      border:"1px solid #eee", borderRadius:16, boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <h1 style={{marginBottom:12}}>Enter Preview Pass</h1>
      <p style={{opacity:.8, marginBottom:16}}>Temporary gate while we add login.</p>
      <form onSubmit={unlock}>
        <input
          type="password"
          value={pass}
          onChange={(e)=>setPass(e.target.value)}
          placeholder="Passcode"
          style={{width:"100%", padding:"12px 14px", borderRadius:10, border:"1px solid #ddd", marginBottom:12}}
        />
        <button type="submit" style={{width:"100%", padding:"12px 14px", borderRadius:10, fontWeight:700,
          background:"var(--hri-yellow,#fee000)", border:"none", cursor:"pointer"}}>
          Unlock
        </button>
        {err && <div style={{color:"crimson", marginTop:10}}>{err}</div>}
      </form>
    </main>
  );
}
