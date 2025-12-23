"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Wallet, Users, Calendar, Plus } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

const CHALLONGE_API_KEY = "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"

export default function TournamentsPage() {
  const { publicKey, connected, connecting, connect } = useWallet()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Form state
  const [tournamentName, setTournamentName] = useState("")
  const [game, setGame] = useState("")
  const [entryFee, setEntryFee] = useState("0.1")

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a tournament",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      // Create tournament on Challonge
      const response = await fetch("https://api.challonge.com/v1/tournaments.json", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: CHALLONGE_API_KEY,
          tournament: {
            name: tournamentName,
            game_name: game,
            tournament_type: "single elimination",
            description: `Entry Fee: ${entryFee} SOL`,
            open_signup: true,
            hold_third_place_match: false,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create tournament")
      }

      const data = await response.json()

      toast({
        title: "Tournament created!",
        description: `${tournamentName} has been created successfully`,
      })

      // Reset form
      setTournamentName("")
      setGame("")
      setEntryFee("0.1")
      setShowCreateForm(false)

      // Refresh tournaments list
      fetchTournaments()
    } catch (error) {
      console.error("[v0] Error creating tournament:", error)
      toast({
        title: "Error",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch(`https://api.challonge.com/v1/tournaments.json?api_key=${CHALLONGE_API_KEY}`)

      if (!response.ok) {
        throw new Error("Failed to fetch tournaments")
      }

      const data = await response.json()
      setTournaments(data)
    } catch (error) {
      console.error("[v0] Error fetching tournaments:", error)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Sol Arena</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/tournaments" className="text-sm text-foreground font-medium">
                Tournaments
              </Link>
              <Link
                href="/#how-it-works"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                How It Works
              </Link>
            </div>
            {connected ? (
              <Button size="sm" variant="outline">
                <Wallet className="w-4 h-4 mr-2" />
                {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
              </Button>
            ) : (
              <Button size="sm" onClick={connect} disabled={connecting}>
                <Wallet className="w-4 h-4 mr-2" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold">Tournaments</h1>
              <p className="text-xl text-muted-foreground">Enter competitions and win SOL</p>
            </div>
            {connected && (
              <Button size="lg" onClick={() => setShowCreateForm(!showCreateForm)}>
                <Plus className="w-5 h-5 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>

          {/* Create Tournament Form */}
          {showCreateForm && (
            <Card className="p-6 mb-8 border-2 border-primary/20">
              <form onSubmit={createTournament} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Create New Tournament</h3>
                  <p className="text-muted-foreground">Set up a new competition for players to join</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Tournament Name</Label>
                    <Input
                      id="name"
                      placeholder="Battle Royale #1"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="game">Game</Label>
                    <Select value={game} onValueChange={setGame} required>
                      <SelectTrigger id="game">
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fortnite">Fortnite</SelectItem>
                        <SelectItem value="The Finals">The Finals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entry">Entry Fee (SOL)</Label>
                    <Input
                      id="entry"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.1"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Tournament"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            <Card className="p-6 space-y-2 bg-card border-2 border-border">
              <div className="text-sm text-muted-foreground">Total Tournaments</div>
              <div className="text-3xl font-bold text-primary">{tournaments.length}</div>
            </Card>
            <Card className="p-6 space-y-2 bg-card border-2 border-border">
              <div className="text-sm text-muted-foreground">Active Now</div>
              <div className="text-3xl font-bold text-primary">
                {tournaments.filter((t) => t.tournament?.state === "underway").length}
              </div>
            </Card>
            <Card className="p-6 space-y-2 bg-card border-2 border-border">
              <div className="text-sm text-muted-foreground">Total Players</div>
              <div className="text-3xl font-bold">2,431</div>
            </Card>
            <Card className="p-6 space-y-2 bg-card border-2 border-border">
              <div className="text-sm text-muted-foreground">Total Prize Pool</div>
              <div className="text-3xl font-bold text-primary">15.8 SOL</div>
            </Card>
          </div>

          {/* Tournaments List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Active Tournaments</h2>

            {!connected && (
              <Card className="p-8 text-center space-y-4 border-2 border-border">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Connect your wallet</h3>
                  <p className="text-muted-foreground">Connect your Solana wallet to view and join tournaments</p>
                </div>
                <Button size="lg" onClick={connect} disabled={connecting}>
                  <Wallet className="w-5 h-5 mr-2" />
                  {connecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              </Card>
            )}

            {connected && tournaments.length === 0 && (
              <Card className="p-8 text-center space-y-4 border-2 border-border">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">No tournaments yet</h3>
                  <p className="text-muted-foreground">Be the first to create a tournament</p>
                </div>
                <Button size="lg" onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Tournament
                </Button>
              </Card>
            )}

            {connected && (
              <div className="grid gap-4">
                {tournaments.map((item) => {
                  const tournament = item.tournament
                  return (
                    <Card
                      key={tournament.id}
                      className="p-6 border-2 border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold">{tournament.name}</h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tournament.state === "underway"
                                  ? "bg-primary/20 text-primary"
                                  : tournament.state === "pending"
                                    ? "bg-blue-500/20 text-blue-500"
                                    : "bg-gray-500/20 text-gray-500"
                              }`}
                            >
                              {tournament.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{tournament.participants_count} players</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(tournament.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {tournament.game_name && (
                            <div className="text-sm text-muted-foreground">Game: {tournament.game_name}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <div className="text-2xl font-bold text-primary">
                            {tournament.description?.match(/[\d.]+/)?.[0] || "0.1"} SOL
                          </div>
                          <Button>Join Tournament</Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
