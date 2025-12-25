import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// Complete tournament and record winner
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { winnerWallet, burnTxSignature } = body

    if (!winnerWallet || !burnTxSignature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("arena_wager_tournaments")
      .update({
        status: "completed",
        winner_wallet: winnerWallet,
        prize_distributed_at: new Date().toISOString(),
        burn_tx_signature: burnTxSignature,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (tournamentError) throw tournamentError

    // Update winner's participation record
    const { error: participantError } = await supabase
      .from("arena_wager_participants")
      .update({
        status: "winner",
        placement: 1,
        prize_received: tournament.winner_amount,
      })
      .eq("tournament_id", params.id)
      .eq("player_wallet", winnerWallet)

    if (participantError) throw participantError

    return NextResponse.json({ tournament, success: true })
  } catch (error) {
    console.error("[Arena Wager API] Error completing tournament:", error)
    return NextResponse.json({ error: "Failed to complete tournament" }, { status: 500 })
  }
}
