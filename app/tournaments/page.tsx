"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Wallet, Users, Calendar, Loader2, X } from "lucide-react"
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
  bannerUrl?: string | null
  challonge: {
    id: string
    url: string
    state: string
  }
  startDate: string | null
}

export default function TournamentsPage() {
  const { publicKey, connected, connecting, connect, getProvider } = useWallet()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [tournamentStats, setTournamentStats] = useState({
    totalPlayers: 0,
    totalPrizePool: 0,
  })
  const [programStatus, setProgramStatus] = useState<ReturnType<SolArenaProgram["getProgramStatus"]> | null>(null)

  const [showRegistrationForm, setShowRegistrationForm] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [solanaProgram, setSolanaProgram] = useState<SolArenaProgram | null>(null)
  const [registering, setRegistering] = useState<string | null>(null)
  const supabase = useMemo(() => createBrowserClient(), [])

  // Form state
  const [tournamentName, setTournamentName] = useState("")
  const [game, setGame] = useState("")
  const [entryFee, setEntryFee] = useState("0.1")
  const [tournamentDate, setTournamentDate] = useState("")
  const [tournamentTime, setTournamentTime] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("32")
  const [bannerImage, setBannerImage] = useState<string | null>(null)

  const [registrationData, setRegistrationData] = useState({
    inGameUsername: "",
    discordHandle: "",
    teamName: "",
  })

  const formatStartDate = (value?: string | null) => {
    if (!value) return "Date TBA"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Date TBA"
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
  }

  useEffect(() => {
    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
    const program = new SolArenaProgram(rpcUrl)
    program.initialize(publicKey ? { publicKey } : null).then(() => {
      setSolanaProgram(program)
      setProgramStatus(program.getProgramStatus())
      if (connected) {
        fetchTournaments()
      }
      console.log("[v0] SolArena program initialized with wallet:", publicKey?.toString())
    })
  }, [connected, publicKey])

  const handleBannerUpload = async (file?: File | null) => {
    if (!file) {
      setBannerImage(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file.",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    const toBase64 = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

    try {
      const base64 = await toBase64()
      setBannerImage(base64)
    } catch (error) {
      console.error("[v0] Error reading banner file:", error)
      toast({
        title: "Upload failed",
        description: "Could not read the selected image. Please try again.",
        variant: "destructive",
      })
    }
  }

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

    const provider = getProvider()
    if (!provider || !provider.publicKey) {
      toast({
        title: "Wallet error",
        description: "Could not get wallet address",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      console.log("[v0] Creating tournament:", {
        tournamentName,
        game,
        entryFee,
        tournamentDate,
        tournamentTime,
        maxParticipants,
      })

      const startDateTime =
        tournamentDate && tournamentTime ? new Date(`${tournamentDate}T${tournamentTime}`).toISOString() : null

      const challongeResponse = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tournamentName,
          game: game,
          entryFee: Number.parseFloat(entryFee),
          maxParticipants: Number.parseInt(maxParticipants),
          startDate: startDateTime ?? undefined,
          walletAddress: provider.publicKey.toString(),
          bannerImage,
        }),
      })

      if (!challongeResponse.ok) {
        const errorData = await challongeResponse.json()
        throw new Error(errorData.error || "Failed to create tournament on Challonge")
      }

      const challongeData = await challongeResponse.json()
      console.log("[v0] Tournament created successfully:", challongeData)

      if (solanaProgram) {
        try {
          const entryFeeInLamports = Number.parseFloat(entryFee) * LAMPORTS_PER_SOL
          const result = await solanaProgram.createTournament(
            provider,
            challongeData.tournament.challonge_id,
            entryFeeInLamports,
          )
          console.log("[v0] On-chain tournament created:", result)
        } catch (blockchainError) {
          console.error("[v0] Blockchain error (non-critical):", blockchainError)
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
      setTournamentDate("")
      setTournamentTime("")
      setMaxParticipants("32")
      setBannerImage(null)
      setShowCreateForm(false)

      // Refresh tournaments list
      await new Promise((resolve) => setTimeout(resolve, 1000))
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

      const tournamentUuid = selectedTournament.id
      const challongeTournamentId = selectedTournament.challonge?.id || selectedTournament.id

      console.log("[v0] Registering for tournament:", tournamentId)
      console.log("[v0] Registration data:", registrationData)

      toast({
        title: "Approve SOL transfer",
        description: `Confirm ${entryFeeSol} SOL transfer in your wallet to join the tournament.`,
      })

      const entryFeeLamports = Math.round(entryFeeSol * LAMPORTS_PER_SOL)
      const result = await solanaProgram.registerForTournament(provider, tournamentId, entryFeeLamports)

      console.log("[v0] Registration successful:", result)

      if (!supabase) {
        toast({
          title: "Service unavailable",
          description: "Supabase is not configured. Unable to save registration.",
          variant: "destructive",
        })
        return
      }

      // Get player profile
      const { data: profileData } = await supabase
        .from("player_profiles")
        .select("id")
        .eq("wallet_address", provider.publicKey.toString())
        .single()

      if (profileData) {
        const { error: insertError } = await supabase.from("tournament_participations").insert({
          tournament_uuid: tournamentUuid,
          player_id: profileData.id,
          wallet_address: provider.publicKey.toString(),
          tournament_id: challongeTournamentId,
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
        description: `You've joined the tournament. ${entryFeeSol} SOL has been deposited to the escrow program (${
          result.escrowAddress ? `${result.escrowAddress.slice(0, 4)}...${result.escrowAddress.slice(-4)}` : "wallet"
        }).`,
      })

      setTournaments((prev) =>
        prev.map((tournament) => {
          if (tournament.id !== selectedTournament.id) return tournament
          const updatedCount = (tournament.currentParticipants || 0) + 1
          return {
            ...tournament,
            currentParticipants: updatedCount,
            prizePool: Number.parseFloat((Number(tournament.entryFee) * updatedCount).toFixed(2)),
          }
        }),
      )

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

  const fetchTournaments = async () => {
    try {
      console.log("[v0] Fetching tournaments...")
      const response = await fetch("/api/tournaments", { cache: "no-store" })
      const data = await response.json()
      console.log("[v0] Tournaments fetched:", data)

      const tournamentsArray = data.tournaments || []

      const transformedTournaments = tournamentsArray.map((t: any) => ({
        id: t.id,
        name: t.name,
        game: t.game,
        entryFee: t.entryFee, // Use camelCase from API
        prizePool: t.prizePool, // Use camelCase from API
        maxParticipants: t.maxParticipants, // Use camelCase from API
        currentParticipants: t.currentParticipants, // Use camelCase from API
        status: t.status,
        challonge: t.challonge, // Use nested object directly from API
        bannerUrl: t.bannerUrl,
        startDate: t.startDate || t.start_time || t.created_at || null,
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
    if (!supabase) {
      console.error("[v0] Supabase client is not configured; skipping stats fetch.")
      return
    }

    try {
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

  const handleJoinTournament = async (tournament: Tournament) => {
    if (connecting) return

    if (tournament.status !== "completed" && !connected) {
      try {
        await connect()
      } catch (error) {
        console.error("[v0] Wallet connect error:", error)
      }

      const provider = getProvider()

      if (provider && !provider.publicKey) {
        try {
          await provider.connect()
        } catch (error) {
          console.error("[v0] Phantom connect error:", error)
        }
      }

      if (!provider?.publicKey) {
        toast({
          title: "Wallet required",
          description: "Connect your wallet to join this tournament",
          variant: "destructive",
        })
        return
      }
    }

    openRegistrationForm(tournament)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Action Buttons */}
      <main className="container mx-auto px-4 py-8 pt-20 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-primary via-red-500 to-orange-500 bg-clip-text text-transparent">
              Tournaments
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compete in high-stakes tournaments and climb the leaderboards
          </p>
        </div>

        {programStatus && (
          <Card className="max-w-4xl mx-auto border-2 border-border/60">
            <CardHeader>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="text-lg">On-chain tournament escrow status</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    RPC: {programStatus.rpcUrl} • Program ID:{" "}
                    {programStatus.configuredProgramId || "not configured"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    programStatus.deployedOnCluster
                      ? "bg-green-500/10 text-green-500 border border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                  }`}
                >
                  {programStatus.deployedOnCluster ? "Program live on cluster" : "Program not detected on cluster"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {programStatus.programIdValid ? (
                <p className="text-sm text-muted-foreground">
                  {programStatus.deployedOnCluster
                    ? "Escrow PDA derivations will use the configured tournament program."
                    : "Program ID is set, but no executable account was found at this address on the selected cluster. Deploy the program and retry."}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add a valid program ID via <code>NEXT_PUBLIC_TOURNAMENT_PROGRAM_ID</code>{" "}
                  (or SOLARENA_TOURNAMENT_PROGRAM_ID) to activate escrow flows.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => setShowCreateForm(true)}
            disabled={!connected}
            className="bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Create Tournament
          </Button>
          {!connected && (
            <p className="text-sm text-muted-foreground w-full text-center">
              Connect your wallet to create or join tournaments
            </p>
          )}
        </div>

        {/* Tournaments Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="border-2 border-border/50 hover:border-primary/50 transition-all duration-300"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{tournament.game}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tournament.status === "pending"
                        ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
                        : tournament.status === "in_progress"
                          ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          : "bg-green-500/10 text-green-500 border border-green-500/20"
                    }`}
                  >
                    {tournament.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {tournament.currentParticipants}/{tournament.maxParticipants}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{formatStartDate(tournament.startDate)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entry Fee</span>
                  <span className="font-bold text-primary">{tournament.entryFee} SOL</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prize Pool</span>
                  <span className="font-bold text-green-500">{tournament.prizePool} SOL</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
                    onClick={() => handleJoinTournament(tournament)}
                    disabled={connecting}
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    {tournament.status === "completed" ? "View Results" : "Join Tournament"}
                  </Button>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/tournaments/${tournament.id}`}>View Event Page</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tournaments.length === 0 && (
          <Card className="p-8 text-center space-y-4 border-2 border-border">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">No tournaments available</h3>
              <p className="text-muted-foreground">Be the first to create a tournament</p>
            </div>
            {connected && (
              <Button size="lg" onClick={() => setShowCreateForm(true)}>
                <Trophy className="w-5 h-5 mr-2" />
                Create Tournament
              </Button>
            )}
          </Card>
        )}
      </main>

      {/* Create Tournament Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 border-2 border-primary/20 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCreateForm(false)
                setTournamentName("")
                setGame("")
                setEntryFee("0.1")
                setTournamentDate("")
                setTournamentTime("")
                setMaxParticipants("32")
                setBannerImage(null)
              }}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={createTournament} className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Create Tournament</h3>
                <p className="text-muted-foreground">Set up your tournament and invite players to compete</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tournamentName">
                    Tournament Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tournamentName"
                    placeholder="Summer Championship 2024"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Choose a memorable name for your tournament</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="game">
                    Game <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="game"
                    placeholder="Counter-Strike 2, Valorant, etc."
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">What game will this tournament be for?</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bannerImage">Banner Image</Label>
                  <Input
                    id="bannerImage"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBannerUpload(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">Upload an eye-catching banner (max 5MB).</p>
                  {bannerImage && (
                    <div className="relative h-32 w-full overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={bannerImage} alt="Tournament banner preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tournamentDate">
                      Start Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tournamentDate"
                      type="date"
                      value={tournamentDate}
                      onChange={(e) => setTournamentDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tournamentTime">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="tournamentTime"
                      type="time"
                      value={tournamentTime}
                      onChange={(e) => setTournamentTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryFee">
                      Entry Fee (SOL) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="entryFee"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.1"
                      value={entryFee}
                      onChange={(e) => setEntryFee(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">Amount each player pays to enter</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">
                      Max Participants <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="maxParticipants"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="8">8 Players</option>
                      <option value="16">16 Players</option>
                      <option value="32">32 Players</option>
                      <option value="64">64 Players</option>
                      <option value="128">128 Players</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Maximum number of players allowed</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Tournament Summary</h4>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Entry Fee</span>
                    <span className="font-bold">{entryFee} SOL</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Prize Pool</span>
                    <span className="font-bold text-primary">
                      {(Number.parseFloat(entryFee || "0") * Number.parseInt(maxParticipants || "0")).toFixed(2)} SOL
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max Players</span>
                    <span className="font-bold">{maxParticipants} players</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Prize Distribution: 1st (60%) • 2nd (30%) • 3rd (10%)
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isCreating} className="flex-1">
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Tournament...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Create Tournament
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setTournamentName("")
                    setGame("")
                    setEntryFee("0.1")
                    setTournamentDate("")
                    setTournamentTime("")
                    setMaxParticipants("32")
                    setBannerImage(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Registration Form */}
      {showRegistrationForm && (
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
                <p className="text-muted-foreground">{selectedTournament?.name}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Entry Fee</span>
                  <span className="font-bold">{selectedTournament?.entryFee} SOL</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Prize Pool</span>
                  <span className="font-bold text-primary">~{selectedTournament?.prizePool.toFixed(2)} SOL</span>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Prize Distribution: 1st (60%) • 2nd (30%) • 3rd (10%)
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
                  <p className="text-xs text-muted-foreground">Your username in {selectedTournament?.game}</p>
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
    </div>
  )
}
