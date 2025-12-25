"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, TrendingUp, Users, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface TeamLeaderboardEntry {
  id: string
  name: string
  logo_url: string
  total_wins: number
  total_losses: number
  total_earnings: number
  win_rate: number
}

interface PlayerLeaderboardEntry {
  id: string
  username: string
  profile_image_url: string
  wallet_address: string
  wins: number
  losses: number
  total_earnings: number
  win_rate: number
}

const GAMES = [
  "Fortnite",
  "The Finals",
  "Call of Duty",
  "Apex Legends",
  "Valorant",
  "CS2",
  "Rocket League",
  "Street Fighter 6",
  "Super Smash Bros",
]

export default function LeaderboardsPage() {
  const [selectedGame, setSelectedGame] = useState(GAMES[0])
  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamLeaderboardEntry[]>([])
  const [playerLeaderboard, setPlayerLeaderboard] = useState<PlayerLeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboards()
  }, [selectedGame])

  const fetchLeaderboards = async () => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Fetch team leaderboard for selected game
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, logo_url, game, total_wins, total_losses, total_earnings")
        .eq("game", selectedGame)
        .order("total_wins", { ascending: false })
        .limit(10)

      if (teamsError) throw teamsError

      const teamsWithWinRate = (teams || []).map((team) => ({
        ...team,
        win_rate:
          team.total_wins + team.total_losses > 0 ? (team.total_wins / (team.total_wins + team.total_losses)) * 100 : 0,
      }))

      setTeamLeaderboard(teamsWithWinRate)

      // Fetch player leaderboard for selected game
      const { data: players, error: playersError } = await supabase
        .from("player_profiles")
        .select("id, username, profile_image_url, wallet_address, wins, losses, total_earnings, favorite_games")
        .contains("favorite_games", [selectedGame])
        .order("wins", { ascending: false })
        .limit(10)

      if (playersError) throw playersError

      const playersWithWinRate = (players || []).map((player) => ({
        ...player,
        win_rate: player.wins + player.losses > 0 ? (player.wins / (player.wins + player.losses)) * 100 : 0,
      }))

      setPlayerLeaderboard(playersWithWinRate)
    } catch (error) {
      console.error("[v0] Error fetching leaderboards:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-600" />
    return <span className="text-muted-foreground font-semibold">#{rank}</span>
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 pt-20 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
              Leaderboards
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Top teams and players across all games</p>
        </div>

        {/* Game Selector */}
        <div className="flex flex-wrap gap-2 justify-center">
          {GAMES.map((game) => (
            <button
              key={game}
              onClick={() => setSelectedGame(game)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedGame === game
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        {/* Leaderboards Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Team Leaderboard */}
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : teamLeaderboard.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">No teams found for {selectedGame}</p>
                  <Link href="/teams" className="text-primary hover:underline text-sm">
                    Create the first team
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {teamLeaderboard.map((team, index) => (
                    <Link
                      key={team.id}
                      href={`/teams/${team.id}`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center justify-center w-8">{getRankBadge(index + 1)}</div>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {team.logo_url ? (
                          <img
                            src={team.logo_url || "/placeholder.svg"}
                            alt={team.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-orange-500/20">
                            <Trophy className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate group-hover:text-primary transition-colors">
                          {team.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>
                            {team.total_wins}W - {team.total_losses}L
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {team.win_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-500">{team.total_earnings.toFixed(2)} SOL</div>
                        <div className="text-xs text-muted-foreground">earnings</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Leaderboard */}
          <Card className="border-2 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Individual Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : playerLeaderboard.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-muted-foreground">No players found for {selectedGame}</p>
                  <Link href="/dashboard" className="text-primary hover:underline text-sm">
                    Set up your profile
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {playerLeaderboard.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8">{getRankBadge(index + 1)}</div>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        {player.profile_image_url ? (
                          <img
                            src={player.profile_image_url || "/placeholder.svg"}
                            alt={player.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-orange-500/20">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{player.username || "Anonymous"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>
                            {player.wins}W - {player.losses}L
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {player.win_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-500">{player.total_earnings.toFixed(2)} SOL</div>
                        <div className="text-xs text-muted-foreground">earnings</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
