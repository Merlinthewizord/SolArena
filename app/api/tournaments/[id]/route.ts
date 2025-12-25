import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY || "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"
const CHALLONGE_API_URL = "https://api.challonge.com/v1"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    const { data: participants, error: participantsError } = await supabase
      .from("tournament_participations")
      .select("id, wallet_address, in_game_username, discord_handle, team_name, status, registered_at")
      .eq("tournament_uuid", id)
      .order("registered_at", { ascending: true })

    if (participantsError) {
      console.error("[v0] Error loading tournament participants:", participantsError)
    }

    let challongeTournament: any = null
    try {
      const response = await fetch(`${CHALLONGE_API_URL}/tournaments/${tournament.challonge_id}.json?api_key=${CHALLONGE_API_KEY}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })

      if (response.ok) {
        challongeTournament = await response.json()
      }
    } catch (challongeError) {
      console.error("[v0] Challonge detail fetch failed:", challongeError)
    }

    const entryFee = Number.parseFloat(tournament.entry_fee_sol || "0")
    const participantCount = participants?.length ?? 0
    const prizePool = Number.parseFloat((entryFee * participantCount).toFixed(2))

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        game: tournament.game,
        entryFee,
        prizePool,
        maxParticipants: tournament.max_participants,
        currentParticipants: participantCount,
        status: tournament.status,
        startDate: tournament.start_time,
        bannerUrl: tournament.banner_url || null,
        challonge: challongeTournament
          ? {
              id: challongeTournament.tournament.id,
              url: challongeTournament.tournament.full_challonge_url,
              state: challongeTournament.tournament.state,
            }
          : null,
      },
      participants: participants || [],
    })
  } catch (error) {
    console.error("[v0] Error fetching tournament detail:", error)
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 })
  }
}
