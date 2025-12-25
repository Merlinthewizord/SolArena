"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/components/wallet-provider"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, TrendingUp, Target, ArrowLeft, MapPin, Gamepad2, Calendar } from "lucide-react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { VideoBackground } from "@/components/video-background"

export default function DashboardPage() {
  const { profile, connected } = useWallet()
  const router = useRouter()
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const supabase = useMemo(() => createBrowserClient(), [])

  useEffect(() => {
    if (!connected) {
      router.push("/")
      return
    }

    const fetchTournamentHistory = async () => {
      if (!profile?.wallet_address) return

      if (!supabase) {
        console.error("[v0] Supabase client is not configured; skipping tournament history fetch.")
        setLoadError("Unable to load tournament history right now.")
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from("tournament_participations")
          .select("*")
          .eq("wallet_address", profile.wallet_address)
          .order("registered_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching tournament history:", error)
          setTournaments([])
        } else {
          console.log("[v0] Fetched tournament history:", data)
          setTournaments(data || [])
        }
      } catch (error) {
        console.error("[v0] Error fetching tournament history:", error)
        setTournaments([])
      } finally {
        setLoading(false)
      }
    }

    fetchTournamentHistory()
  }, [connected, router, profile, supabase])

  if (!profile || !connected) {
    return null
  }

  const winRate =
    profile.wins + profile.losses > 0 ? ((profile.wins / (profile.wins + profile.losses)) * 100).toFixed(1) : "0.0"

  return (
    <div className="min-h-screen">
      <VideoBackground />

      <Navigation />

      <div className="container mx-auto px-4 lg:px-8 py-24 relative z-10">
        {/* Back button */}
        <div className="mb-6">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-card to-secondary/30 border-2 border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={profile.profile_image_url || ""} alt={profile.username} />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {profile.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-4xl font-bold">{profile.username}</h1>
                <Badge variant="secondary" className="w-fit">
                  <Trophy className="w-3 h-3 mr-1" />
                  Player
                </Badge>
              </div>

              {profile.bio && <p className="text-muted-foreground text-lg">{profile.bio}</p>}

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
              </div>

              {profile.favorite_games && profile.favorite_games.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {profile.favorite_games.map((game: string, index: number) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      <Gamepad2 className="w-3 h-3" />
                      {game}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-primary">{profile.total_earnings || "0"} SOL</div>
            <p className="text-xs text-muted-foreground">Lifetime winnings</p>
          </Card>

          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Win Rate</span>
            </div>
            <div className="text-3xl font-bold">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {profile.wins}W - {profile.losses}L
            </p>
          </Card>

          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Tournaments</span>
            </div>
            <div className="text-3xl font-bold">{profile.wins + profile.losses}</div>
            <p className="text-xs text-muted-foreground">Total participated</p>
          </Card>

          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Wins</span>
            </div>
            <div className="text-3xl font-bold text-primary">{profile.wins}</div>
            <p className="text-xs text-muted-foreground">Victory count</p>
          </Card>
        </div>

        {/* Tournament History */}
        <Card className="p-6 border-2 border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Tournament History</h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tournaments">View All Tournaments</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tournament history...</div>
          ) : loadError ? (
            <div className="text-center py-8 text-muted-foreground">{loadError}</div>
          ) : tournaments.length > 0 ? (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tournament.placement === 1
                          ? "bg-primary/10"
                          : tournament.placement === 2
                            ? "bg-muted"
                            : tournament.placement
                              ? "bg-muted/50"
                              : "bg-muted/30"
                      }`}
                    >
                      <Trophy
                        className={`w-6 h-6 ${
                          tournament.placement === 1
                            ? "text-primary"
                            : tournament.placement === 2
                              ? "text-muted-foreground"
                              : tournament.placement
                                ? "text-muted-foreground/50"
                                : "text-muted-foreground/30"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{tournament.tournament_name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{tournament.game}</span>
                        <span>•</span>
                        <span>{new Date(tournament.registered_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{tournament.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {tournament.status === "completed" && tournament.placement ? (
                      <>
                        <Badge
                          variant={tournament.placement === 1 ? "default" : "secondary"}
                          className={tournament.placement === 1 ? "bg-primary" : ""}
                        >
                          {tournament.placement === 1
                            ? "1st Place"
                            : tournament.placement === 2
                              ? "2nd Place"
                              : `${tournament.placement}${tournament.placement === 3 ? "rd" : "th"} Place`}
                        </Badge>
                        {tournament.prize_amount > 0 && (
                          <div className="text-sm font-semibold text-primary mt-2">
                            +{Number(tournament.prize_amount).toFixed(2)} SOL
                          </div>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {tournament.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">No tournaments yet</h3>
                <p className="text-muted-foreground">Start competing to build your tournament history</p>
              </div>
              <Button asChild>
                <Link href="/tournaments">Browse Tournaments</Link>
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
