import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const { playerWallet, wagerAmount, wagerTxSignature, inGameUsername, discordHandle, teamName } = body

    if (!playerWallet || !wagerAmount || !wagerTxSignature || !inGameUsername) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get tournament
    const { data: tournament, error: tournamentError } = await supabase
      .from("arena_wager_tournaments")
      .select("*")
      .eq("id", params.id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    if (tournament.status !== "registration") {
      return NextResponse.json({ error: "Tournament registration is closed" }, { status: 400 })
    }

    if (tournament.current_participants >= tournament.max_participants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 })
    }

    // Get player profile
    const { data: profile } = await supabase
      .from("player_profiles")
      .select("id")
      .eq("wallet_address", playerWallet)
      .single()

    // Register participant
    const { data: participant, error: participantError } = await supabase
      .from("arena_wager_participants")
      .insert({
        tournament_id: params.id,
        player_wallet: playerWallet,
        player_id: profile?.id,
        wager_amount: wagerAmount,
        wager_tx_signature: wagerTxSignature,
        in_game_username: inGameUsername,
        discord_handle: discordHandle,
        team_name: teamName,
        status: "registered",
      })
      .select()
      .single()

    if (participantError) throw participantError

    return NextResponse.json({ participant, success: true })
  } catch (error) {
    console.error("[Arena Wager API] Error joining tournament:", error)
    return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 })
  }
}
