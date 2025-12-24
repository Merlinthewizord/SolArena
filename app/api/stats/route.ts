import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total number of player profiles
    const { count: totalPlayers, error: playersError } = await supabase
      .from("player_profiles")
      .select("*", { count: "exact", head: true })

    if (playersError) {
      console.error("[v0] Error fetching player count:", playersError)
    }

    // Get total prizes distributed
    const { data: prizeData, error: prizeError } = await supabase
      .from("tournament_participations")
      .select("prize_amount")
      .eq("status", "completed")
      .not("prize_amount", "is", null)

    if (prizeError) {
      console.error("[v0] Error fetching prize data:", prizeError)
    }

    const totalPrizesSol =
      prizeData?.reduce((sum, record) => sum + (Number.parseFloat(record.prize_amount) || 0), 0) || 0

    // Calculate win rate across all players
    const { data: profilesData, error: profilesError } = await supabase.from("player_profiles").select("wins, losses")

    if (profilesError) {
      console.error("[v0] Error fetching profiles for win rate:", profilesError)
    }

    let totalWins = 0
    let totalGames = 0

    profilesData?.forEach((profile) => {
      totalWins += profile.wins || 0
      totalGames += (profile.wins || 0) + (profile.losses || 0)
    })

    const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0

    // Get active tournament count from tournaments table
    const { count: activeTournaments } = await supabase
      .from("tournaments")
      .select("*", { count: "exact", head: true })
      .in("status", ["open", "active"])

    // Get top games by player count
    const { data: participations } = await supabase.from("tournament_participations").select("game")

    const gameCounts: Record<string, number> = {}
    participations?.forEach((p) => {
      if (p.game) {
        gameCounts[p.game] = (gameCounts[p.game] || 0) + 1
      }
    })

    const topGames = Object.entries(gameCounts)
      .map(([game, activePlayers]) => ({ game, activePlayers }))
      .sort((a, b) => b.activePlayers - a.activePlayers)
      .slice(0, 5)

    return NextResponse.json({
      activePlayers: totalPlayers || 0,
      totalPrizesSol: Number.parseFloat(totalPrizesSol.toFixed(2)),
      winRate,
      activeTournaments: activeTournaments || 0,
      topGames,
    })
  } catch (error) {
    console.error("[v0] Error in stats API:", error)
    return NextResponse.json(
      {
        activePlayers: 0,
        totalPrizesSol: 0,
        winRate: 0,
        activeTournaments: 0,
        topGames: [],
      },
      { status: 500 },
    )
  }
}
