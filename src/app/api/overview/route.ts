import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: overview, error: oErr } = await supabaseServer
    .from("org_overview").select("*").single()
  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 400 })

  const { data: scores, error: sErr } = await supabaseServer
    .from("scores").select("pillar, score, assessment_id")
    .eq("assessment_id", overview.assessment_id)
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 400 })

  return NextResponse.json({ overview, scores: scores ?? [] })
}
