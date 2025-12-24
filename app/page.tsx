"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Wallet, Users, Zap, Shield, ArrowRight, Gamepad2 } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { VideoBackground } from "@/components/video-background"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Navigation } from "@/components/navigation"

interface Stats {
  totalPlayers: number
  totalPrizes: number
  winRate: number
  gameCounts: {
    fortnite: number
    theFinals: number
    valorant: number
    cs2: number
    leagueOfLegends: number
    dota2: number
    callOfDuty: number
    apexLegends: number
    rocketLeague: number
    streetFighter6: number
    tekken8: number
    superSmashBros: number
  }
  avgEntry: string
  avgPrize: string
  totalTournaments: number
}

export default function Home() {
  const { connected, profile, connect } = useWallet() // Added connect to destructured values
  const [stats, setStats] = useState<Stats>({
    totalPlayers: 0,
    totalPrizes: 0,
    winRate: 0,
    gameCounts: {
      fortnite: 0,
      theFinals: 0,
      valorant: 0,
      cs2: 0,
      leagueOfLegends: 0,
      dota2: 0,
      callOfDuty: 0,
      apexLegends: 0,
      rocketLeague: 0,
      streetFighter6: 0,
      tekken8: 0,
      superSmashBros: 0,
    },
    avgEntry: "0.1",
    avgPrize: "0",
    totalTournaments: 0,
  })
  const [liveTournament, setLiveTournament] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/stats")
        if (!response.ok) {
          console.log("[v0] Stats API returned error:", response.status)
          setLoading(false)
          return
        }
        const data = await response.json()
        setStats({
          totalPlayers: Number(data.totalPlayers) || 0,
          totalPrizes: Number(data.totalPrizes) || 0,
          winRate: Number(data.winRate) || 0,
          gameCounts: {
            fortnite: Number(data.gameCounts?.fortnite) || 0,
            theFinals: Number(data.gameCounts?.theFinals) || 0,
            valorant: Number(data.gameCounts?.valorant) || 0,
            cs2: Number(data.gameCounts?.cs2) || 0,
            leagueOfLegends: Number(data.gameCounts?.leagueOfLegends) || 0,
            dota2: Number(data.gameCounts?.dota2) || 0,
            callOfDuty: Number(data.gameCounts?.callOfDuty) || 0,
            apexLegends: Number(data.gameCounts?.apexLegends) || 0,
            rocketLeague: Number(data.gameCounts?.rocketLeague) || 0,
            streetFighter6: Number(data.gameCounts?.streetFighter6) || 0,
            tekken8: Number(data.gameCounts?.tekken8) || 0,
            superSmashBros: Number(data.gameCounts?.superSmashBros) || 0,
          },
          avgEntry: data.avgEntry || "0.1",
          avgPrize: data.avgPrize || "0",
          totalTournaments: Number(data.totalTournaments) || 0,
        })
      } catch (error) {
        console.error("[v0] Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchLiveTournament() {
      try {
        const response = await fetch("/api/tournaments?cache=" + Date.now())
        if (!response.ok) {
          console.log("[v0] Tournaments API returned error:", response.status)
          return
        }
        const tournaments = await response.json()

        if (Array.isArray(tournaments)) {
          const openTournament = tournaments.find((t: any) => t.state === "pending" || t.state === "underway")
          if (openTournament) {
            setLiveTournament(openTournament)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching live tournament:", error)
      }
    }

    fetchStats()
    fetchLiveTournament()
  }, [])

  return (
    <div className="min-h-screen">
      <VideoBackground />

      <Navigation />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

        <div className="container relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 flex justify-center lg:justify-start">
              <img
                src="/sol-arena-logo.png"
                alt="Sol Arena Logo"
                className="w-64 h-64 sm:w-80 sm:h-80 lg:w-[32rem] lg:h-[32rem] object-contain animate-in fade-in zoom-in duration-700"
              />
            </div>

            <div className="flex-1 space-y-6 lg:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm mx-auto lg:mx-0">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-primary">Live on Solana</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight text-balance">
                Compete. Win. <span className="text-primary">Earn SOL.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Enter winner-takes-all tournaments with your Solana wallet. Create your profile, join competitions, and
                claim the entire prize pool.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                {connected ? (
                  <Button size="lg" className="text-base" asChild>
                    <Link href="/dashboard">
                      View My Profile
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" className="text-base" onClick={connect} disabled={false}>
                    {" "}
                    {/* Connected to wallet connect function */}
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                <Button size="lg" variant="outline" className="text-base bg-transparent" asChild>
                  <Link href="/tournaments">View Tournaments</Link>
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {loading ? "..." : (stats.totalPlayers || 0).toLocaleString()}
                    {!loading && stats.totalPlayers > 0 && "+"}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Players</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {loading ? "..." : `${(stats.totalPrizes || 0).toFixed(1)} SOL`}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Prizes</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">
                    {loading ? "..." : `${(stats.winRate || 0).toFixed(0)}%`}
                  </div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Available Games */}
      <section className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">Available Games</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Compete in your favorite games and prove you're the best
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Fortnite</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Battle Royale tournaments</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{loading ? "..." : `${stats.gameCounts.fortnite || 0} players`}</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">The Finals</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Team-based competitions</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{loading ? "..." : `${stats.gameCounts.theFinals || 0} players`}</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Valorant</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Tactical 5v5 shooter tournaments</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">CS2</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Counter-Strike 2 competitive matches</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">League of Legends</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">MOBA tournaments and leagues</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Dota 2</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Strategic MOBA competitions</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Call of Duty</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Warzone and multiplayer tournaments</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Apex Legends</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Battle Royale squad competitions</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Rocket League</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Car soccer tournaments</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Street Fighter 6</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Fighting game championships</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Tekken 8</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">3D fighting game tournaments</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>

            <Card className="p-6 space-y-3 bg-card border-2 border-border hover:border-primary/50 transition-all hover:scale-105">
              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                <Gamepad2 className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Super Smash Bros.</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">Platform fighter tournaments</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">How Sol Arena Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start competing and winning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center space-y-4 bg-card border-2 border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  1
                </div>
                <h3 className="text-2xl font-bold">Connect Wallet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Link your Solana wallet and create your player profile in seconds
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center space-y-4 bg-card border-2 border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  2
                </div>
                <h3 className="text-2xl font-bold">Enter Tournament</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Choose a tournament and pay the entry fee in SOL to join the competition
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center space-y-4 bg-card border-2 border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  3
                </div>
                <h3 className="text-2xl font-bold">Claim Rewards</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Win the tournament and instantly receive the entire prize pool in your wallet
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold text-balance">Built for competitors on Solana</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Fast, secure, and transparent tournament platform powered by blockchain technology
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Secure & Transparent</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      All transactions on-chain with instant payouts to winners
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Lightning Fast</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Powered by Solana for near-instant transaction speeds
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Winner Takes All</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Simple format - winner receives the entire prize pool
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Avg Entry</div>
                  <div className="text-3xl font-bold text-primary">{loading ? "..." : `${stats.avgEntry} SOL`}</div>
                </Card>
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Avg Prize</div>
                  <div className="text-3xl font-bold text-primary">{loading ? "..." : `${stats.avgPrize} SOL`}</div>
                </Card>
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Total Players</div>
                  <div className="text-3xl font-bold">
                    {loading ? "..." : (stats.totalPlayers || 0).toLocaleString()}
                  </div>
                </Card>
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Tournaments</div>
                  <div className="text-3xl font-bold">{loading ? "..." : stats.totalTournaments}</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <div className="relative p-12 text-center space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-balance">Ready to compete?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of players competing for SOL rewards. Connect your wallet and enter your first tournament
                today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {connected ? (
                  <Button size="lg" className="text-base" asChild>
                    <Link href="/dashboard">View My Dashboard</Link>
                  </Button>
                ) : (
                  <Button size="lg" className="text-base" onClick={connect} disabled={false}>
                    {" "}
                    {/* Connected to wallet connect function */}
                    <Wallet className="w-5 h-5 mr-2" />
                    Connect Wallet
                  </Button>
                )}
                <Button size="lg" variant="outline" className="text-base bg-transparent" asChild>
                  <Link href="/tournaments">View Live Tournaments</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Sol Arena</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/mission" className="hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link href="/championship" className="hover:text-foreground transition-colors">
                Championship
              </Link>
              <a href="#" className="hover:text-foreground transition-colors">
                About
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 Sol Arena. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
