import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { walletAddress, inGameUsername, discordHandle, teamId } = body

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    const supabase = await createClient()

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    if (tournament.status !== "open") {
      return NextResponse.json({ error: "Tournament is not open for registration" }, { status: 400 })
    }

    // Check if player already registered
    const { data: existingParticipation } = await supabase
      .from("tournament_participations")
      .select("id")
      .eq("tournament_uuid", id)
      .eq("wallet_address", walletAddress)
      .single()

    if (existingParticipation) {
      return NextResponse.json({ error: "Already registered for this tournament" }, { status: 400 })
    }

    // Get player profile
    const { data: profile } = await supabase
      .from("player_profiles")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Player profile not found" }, { status: 404 })
    }

    // Create participation record
    const { data: participation, error: participationError } = await supabase
      .from("tournament_participations")
      .insert({
        tournament_uuid: id,
        player_id: profile.id,
        wallet_address: walletAddress,
        tournament_id: tournament.challonge_id,
        tournament_name: tournament.name,
        game: tournament.game,
        entry_fee: tournament.entry_fee_sol,
        in_game_username: inGameUsername,
        discord_handle: discordHandle || null,
        team_name: teamId || null,
        status: "registered",
      })
      .select()
      .single()

    if (participationError) {
      console.error("[v0] Error creating participation:", participationError)
      return NextResponse.json({ error: "Failed to register for tournament" }, { status: 500 })
    }

    // Get updated participant count
    const { count } = await supabase
      .from("tournament_participations")
      .select("*", { count: "exact", head: true })
      .eq("tournament_uuid", id)

    return NextResponse.json({
      success: true,
      participation,
      participantCount: count || 0,
    })
  } catch (error) {
    console.error("[v0] Error joining tournament:", error)
    return NextResponse.json({ error: "Failed to join tournament" }, { status: 500 })
  }
}
