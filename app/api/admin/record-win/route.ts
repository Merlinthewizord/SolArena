import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { teamId, matchId, tournamentId, payoutAmount, actorWallet } = body

    if (!actorWallet) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Check if actor is admin
    const { data: profile } = await supabase
      .from("player_profiles")
      .select("role")
      .eq("wallet_address", actorWallet)
      .single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 403 })
    }

    // Update team stats
    const { error: teamError } = await supabase
      .from("teams")
      .update({
        total_wins: supabase.raw("total_wins + 1"),
        total_earnings: supabase.raw(`total_earnings + ${payoutAmount}`),
      })
      .eq("id", teamId)

    if (teamError) {
      console.error("[v0] Error updating team:", teamError)
      return NextResponse.json({ error: "Failed to update team stats" }, { status: 500 })
    }

    // Log audit trail
    await supabase.from("admin_audit_log").insert({
      actor_wallet: actorWallet,
      action: "record_win",
      target_type: "team",
      target_id: teamId,
      payload: {
        matchId,
        tournamentId,
        payoutAmount,
      },
    })

    // TODO: Call Anchor rewards program record_win instruction here
    // This would trigger on-chain reward distribution to stakers

    return NextResponse.json({
      success: true,
      message: "Win recorded successfully",
    })
  } catch (error) {
    console.error("[v0] Error recording win:", error)
    return NextResponse.json({ error: "Failed to record win" }, { status: 500 })
  }
}
