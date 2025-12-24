"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"
import VideoBackground from "@/components/video-background"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Wallet, Users, Calendar, Plus, Loader2, X } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/hooks/use-toast"
import { SolArenaProgram } from "@/lib/solana-program"
import { LAMPORTS_PER_SOL } from "@solana/web3.js"
import { createBrowserClient } from "@/lib/supabase/client"

const CHALLONGE_API_KEY = "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"

interface Tournament {
  id: string
  name: string
  game: string
  entryFee: number
  prizePool: number
  maxParticipants: number
  currentParticipants: number
  status: string
  challonge: {
    id: string
    url: string
    state: string
  }
}

export default function TournamentsPage() {
  const { publicKey, connected, connecting, connect, getProvider } = useWallet()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [tournamentStats, setTournamentStats] = useState({
    totalPlayers: 0,
    totalPrizePool: 0,
  })

  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [solanaProgram, setSolanaProgram] = useState<SolArenaProgram | null>(null)
  const [registering, setRegistering] = useState<string | null>(null)

  // Form state
  const [tournamentName, setTournamentName] = useState("")
  const [game, setGame] = useState("")
  const [entryFee, setEntryFee] = useState("0.1")

  const [showCreateForm, setShowCreateForm] = useState(false) // Declared the missing variable

  useEffect(() => {
    if (connected && getProvider()) {
      const provider = getProvider()
      if (provider && provider.publicKey) {
        const program = new SolArenaProgram()
        program
          .initialize(provider)
          .then(() => {
            setSolanaProgram(program)
            console.log("[v0] Solana program initialized")
          })
          .catch((error) => {
            console.error("[v0] Error initializing Solana program:", error)
          })
      }
    }
  }, [connected, getProvider])

  useEffect(() => {
    fetchTournaments()
  }, [])

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

    setIsCreating(true)

    try {
      console.log("[v0] Creating tournament:", { tournamentName, game, entryFee })

      const challongeResponse = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tournamentName,
          game: game,
          entryFee: entryFee,
        }),
      })

      if (!challongeResponse.ok) {
        const errorData = await challongeResponse.json()
        throw new Error(errorData.error || "Failed to create tournament on Challonge")
      }

      const challongeData = await challongeResponse.json()
      const tournamentId = challongeData.tournament.id.toString()
      console.log("[v0] Challonge tournament created:", tournamentId)

      if (solanaProgram) {
        try {
          const provider = getProvider()
          if (provider) {
            const entryFeeInLamports = Number.parseFloat(entryFee) * LAMPORTS_PER_SOL
            const result = await solanaProgram.createTournament(provider, tournamentId, entryFeeInLamports)
            console.log("[v0] On-chain tournament created:", result)
          }
        } catch (blockchainError) {
          console.error("[v0] Blockchain error (non-critical):", blockchainError)
          // Don't fail the entire creation if blockchain part fails
        }
      }

      toast({
        title: "Tournament created!",
        description: `${tournamentName} is ready for players to join`,
      })

      // Reset form
      setTournamentName("")
      setGame("")
      setEntryFee("0.1")
      setShowCreateForm(false)

      await new Promise((resolve) => setTimeout(resolve, 1500))
      await fetchTournaments()
    } catch (error) {
      console.error("[v0] Error creating tournament:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create tournament",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const openRegistrationForm = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setShowRegistrationForm(true)
  }

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected || !solanaProgram || !selectedTournament) {
      toast({
        title: "Not ready",
        description: "Please ensure your wallet is connected",
        variant: "destructive",
      })
      return
    }

    const tournamentId = selectedTournament.id.toString()
    const entryFeeSol = Number.parseFloat(selectedTournament.entryFee)

    setRegistering(tournamentId)

    try {
      const provider = getProvider()
      if (!provider) throw new Error("Wallet provider not found")

      console.log("[v0] Registering for tournament:", tournamentId)
      console.log("[v0] Registration data:", registrationData)

      const result = await solanaProgram.registerForTournament(provider, tournamentId)

      console.log("[v0] Registration successful:", result)

      const supabase = createBrowserClient()

      // Get player profile
      const { data: profileData } = await supabase
        .from("player_profiles")
        .select("id")
        .eq("wallet_address", provider.publicKey.toString())
        .single()

      if (profileData) {
        const { error: insertError } = await supabase.from("tournament_participations").insert({
          player_id: profileData.id,
          wallet_address: provider.publicKey.toString(),
          tournament_id: tournamentId,
          tournament_name: selectedTournament.name,
          game: selectedTournament.game,
          entry_fee: entryFeeSol,
          in_game_username: registrationData.inGameUsername,
          discord_handle: registrationData.discordHandle || null,
          team_name: registrationData.teamName || null,
          status: "registered",
        })

        if (insertError) {
          console.error("[v0] Error saving registration to database:", insertError)
        } else {
          console.log("[v0] Registration saved to database")
        }
      }

      toast({
        title: "Registration successful!",
        description: `You've joined the tournament. ${entryFeeSol} SOL has been deposited to the prize pool.`,
      })

      // Reset form and close modal
      setRegistrationData({
        inGameUsername: "",
        discordHandle: "",
        teamName: "",
      })
      setShowRegistrationForm(false)
      setSelectedTournament(null)

      // Refresh tournaments to update participant count
      fetchTournaments()
    } catch (error) {
      console.error("[v0] Error registering:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to register for tournament",
        variant: "destructive",
      })
    } finally {
      setRegistering(null)
    }
  }

  const registerForTournament = async (tournamentId: string, entryFeeSol: number) => {
    if (!connected || !solanaProgram) {
      toast({
        title: "Not ready",
        description: "Please ensure your wallet is connected",
        variant: "destructive",
      })
      return
    }

    setRegistering(tournamentId)

    try {
      const provider = getProvider()
      if (!provider) throw new Error("Wallet provider not found")

      console.log("[v0] Registering for tournament:", tournamentId)

      const result = await solanaProgram.registerForTournament(provider, tournamentId)

      console.log("[v0] Registration successful:", result)

      toast({
        title: "Registration successful!",
        description: `You've joined the tournament. ${entryFeeSol} SOL has been deposited to the prize pool.`,
      })

      // Refresh tournaments to update participant count
      fetchTournaments()
    } catch (error) {
      console.error("[v0] Error registering:", error)
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to register for tournament",
        variant: "destructive",
      })
    } finally {
      setRegistering(null)
    }
  }

  const fetchTournaments = async () => {
    try {
      console.log("[v0] Fetching tournaments...")
      const response = await fetch("/api/tournaments?t=" + Date.now())
      const data = await response.json()
      console.log("[v0] Tournaments fetched:", data)

      const tournamentsArray = data.tournaments || []

      const transformedTournaments = tournamentsArray.map((t: any) => ({
        id: t.id,
        name: t.name,
        game: t.game,
        entryFee: t.entry_fee,
        prizePool: t.prize_pool,
        maxParticipants: t.max_participants,
        currentParticipants: t.current_participants,
        status: t.status,
        challonge: {
          id: t.challonge_id,
          url: t.challonge_url,
          state: t.status === "active" ? "underway" : t.status === "pending" ? "pending" : "complete",
        },
      }))

      setTournaments(transformedTournaments)
      console.log("[v0] Tournaments state updated with", transformedTournaments.length, "tournaments")

      await fetchTournamentStats()
    } catch (error) {
      console.error("[v0] Error fetching tournaments:", error)
      setTournaments([])
    }
  }

  const fetchTournamentStats = async () => {
    try {
      const supabase = createBrowserClient()

      // Get total unique players who have registered for any tournament
      const { data: players, error: playersError } = await supabase
        .from("tournament_participations")
        .select("wallet_address")

      if (playersError) throw playersError

      // Count unique wallet addresses
      const uniquePlayers = new Set(players?.map((p) => p.wallet_address) || []).size

      const { data: participations, error: participationsError } = await supabase
        .from("tournament_participations")
        .select("entry_fee")

      if (participationsError) throw participationsError

      // Sum all entry fees to get total prize pool
      const totalPrizes = participations?.reduce((sum, p) => sum + (Number(p.entry_fee) || 0), 0) || 0

      setTournamentStats({
        totalPlayers: uniquePlayers,
        totalPrizePool: totalPrizes,
      })
    } catch (error) {
      console.error("[v0] Error fetching tournament stats:", error)
    }
  }

  // Form state
  const [registrationData, setRegistrationData] = useState({
    inGameUsername: "",
    discordHandle: "",
    teamName: "",
  })

  return (
    <div className="min-h-screen">
      <VideoBackground />

      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight">Tournaments</h1>
              <p className="text-muted-foreground">Compete in live tournaments and win SOL prizes</p>
            </div>
            {console.log("[v0] Create Tournament Button State:", { connected, showJoinModal })}
            {connected && (
              <Button
                size="lg"
                onClick={() => {
                  console.log("[v0] Create Tournament button clicked")
                  setShowJoinModal(!showJoinModal)
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Tournament
              </Button>
            )}
          </div>

          {showRegistrationForm && selectedTournament && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl p-6 border-2 border-primary/20 relative">
                <button
                  onClick={() => {
                    setShowRegistrationForm(false)
                    setSelectedTournament(null)
                    setRegistrationData({ inGameUsername: "", discordHandle: "", teamName: "" })
                  }}
                  className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <form onSubmit={submitRegistration} className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Register for Tournament</h3>
                    <p className="text-muted-foreground">{selectedTournament.name}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-primary font-bold">Entry Fee: {selectedTournament.entryFee} SOL</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        {selectedTournament.currentParticipants} players registered
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="inGameUsername">
                        In-Game Username <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="inGameUsername"
                        placeholder="YourGameTag123"
                        value={registrationData.inGameUsername}
                        onChange={(e) => setRegistrationData({ ...registrationData, inGameUsername: e.target.value })}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Your username in {selectedTournament.game}</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discordHandle">Discord Handle</Label>
                      <Input
                        id="discordHandle"
                        placeholder="username#1234"
                        value={registrationData.discordHandle}
                        onChange={(e) => setRegistrationData({ ...registrationData, discordHandle: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Optional - for tournament communication</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="teamName">Team Name (if applicable)</Label>
                      <Input
                        id="teamName"
                        placeholder="My Squad"
                        value={registrationData.teamName}
                        onChange={(e) => setRegistrationData({ ...registrationData, teamName: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">Leave blank if playing solo</p>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Entry Fee</span>
                        <span className="font-bold">{selectedTournament.entryFee} SOL</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Current Prize Pool</span>
                        <span className="font-bold text-primary">~{selectedTournament.prizePool.toFixed(2)} SOL</span>
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        Prize Distribution: 1st (60%) • 2nd (30%) • 3rd (10%)
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={registering !== null} className="flex-1">
                      {registering ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-4 h-4 mr-2" />
                          Pay & Register
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowRegistrationForm(false)
                        setSelectedTournament(null)
                        setRegistrationData({ inGameUsername: "", discordHandle: "", teamName: "" })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {/* Create Tournament Form */}
          {showJoinModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl p-6 border-2 border-primary/20 relative">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

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
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating on blockchain...
                        </>
                      ) : (
                        "Create Tournament"
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowJoinModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
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
                {tournaments.filter((t) => t.challonge.state === "underway").length}
              </div>
            </Card>
            <Card className="p-6 space-y-2 bg-card border-2 border-border">
              <div className="text-sm text-muted-foreground">Total Players</div>
              <div className="text-3xl font-bold">{tournamentStats.totalPlayers.toLocaleString()}</div>
            </Card>
            <Card className="p-6 space-y-2 bg-card border-2 border-border">
              <div className="text-sm text-muted-foreground">Total Prize Pool</div>
              <div className="text-3xl font-bold text-primary">{tournamentStats.totalPrizePool.toFixed(1)} SOL</div>
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
                <Button size="lg" onClick={() => setShowJoinModal(true)}>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Tournament
                </Button>
              </Card>
            )}

            {connected && (
              <div className="grid gap-4">
                {tournaments.map((tournament) => {
                  const isRegistering = registering === tournament.id

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
                                tournament.challonge.state === "underway"
                                  ? "bg-primary/20 text-primary"
                                  : tournament.challonge.state === "pending"
                                    ? "bg-blue-500/20 text-blue-500"
                                    : "bg-gray-500/20 text-gray-500"
                              }`}
                            >
                              {tournament.challonge.state}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{tournament.currentParticipants} players</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(tournament.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {tournament.game && (
                            <div className="text-sm text-muted-foreground">Game: {tournament.game}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-2">
                          <div className="space-y-1 text-right">
                            <div className="text-sm text-muted-foreground">Entry Fee</div>
                            <div className="text-2xl font-bold text-primary">{tournament.entryFee} SOL</div>
                            <div className="text-xs text-muted-foreground">
                              Prize Pool: ~{(tournament.entryFee * tournament.currentParticipants).toFixed(2)} SOL
                            </div>
                          </div>
                          <Button
                            onClick={() => openRegistrationForm(tournament)}
                            disabled={isRegistering || tournament.challonge.state !== "pending"}
                          >
                            {isRegistering ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Registering...
                              </>
                            ) : tournament.challonge.state !== "pending" ? (
                              "Tournament Started"
                            ) : (
                              "Join Tournament"
                            )}
                          </Button>
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
