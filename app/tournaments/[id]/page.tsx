"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Users, Calendar, Trophy, Gamepad2, ExternalLink } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"
import { deriveTournamentPDAs, createRegisterForTournamentInstruction } from "@/lib/solana-program"

interface Tournament {
  id: string
  name: string
  game: string
  entryFee: number
  prizePool: number
  maxParticipants: number
  currentParticipants: number
  status: string
  startDate: string
  created_at: string
  challonge: {
    id: string
    url: string
    state: string
  }
}

interface Participant {
  id: string
  player_wallet: string
  in_game_username: string
  discord_handle: string
  team_name?: string
  status: string
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { connected, publicKey, signTransaction } = useWallet()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    fetchTournamentDetails()
    fetchParticipants()
  }, [params.id])

  const fetchTournamentDetails = async () => {
    try {
      const response = await fetch("/api/tournaments")
      const data = await response.json()
      const found = data.tournaments.find((t: Tournament) => t.id === params.id)
      setTournament(found || null)
    } catch (error) {
      console.error("Error fetching tournament:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  const handleJoinTournament = async () => {
    if (!connected || !publicKey || !signTransaction) {
      alert("Please connect your wallet first")
      return
    }

    if (!tournament) {
      alert("Tournament data not loaded")
      return
    }

    setJoining(true)
    try {
      console.log("[v0] Starting tournament join process...")
      console.log("[v0] Tournament ID:", params.id)
      console.log("[v0] Tournament entry fee:", tournament.entryFee, "SOL")
      console.log("[v0] User wallet:", publicKey)

      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com",
        "confirmed",
      )

      const programId = process.env.NEXT_PUBLIC_TOURNAMENT_PROGRAM_ID || "SoLArenaTournament11111111111111111111111111"

      console.log("[v0] Program ID:", programId)

      const { tournamentPDA, escrowPDA } = await deriveTournamentPDAs(programId, params.id as string)

      console.log("[v0] Tournament PDA:", tournamentPDA.toString())
      console.log("[v0] Escrow PDA:", escrowPDA.toString())

      const entryFeeLamports = Math.floor(tournament.entryFee * LAMPORTS_PER_SOL)

      console.log("[v0] Entry fee in lamports:", entryFeeLamports)

      const userBalance = await connection.getBalance(new PublicKey(publicKey))
      console.log("[v0] User balance:", userBalance / LAMPORTS_PER_SOL, "SOL")

      if (userBalance < entryFeeLamports + 10000) {
        alert(
          `Insufficient SOL balance. You have ${(userBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL but need at least ${tournament.entryFee} SOL + fees.`,
        )
        setJoining(false)
        return
      }

      const { transaction } = await createRegisterForTournamentInstruction(
        connection,
        programId,
        params.id as string,
        new PublicKey(publicKey),
      )

      console.log("[v0] Transaction created with program instruction, requesting user signature...")

      const signedTransaction = await signTransaction(transaction)

      if (!signedTransaction) {
        throw new Error("Transaction signing cancelled")
      }

      console.log("[v0] Transaction signed, sending to blockchain...")

      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      })

      console.log("[v0] Transaction sent, signature:", signature)
      console.log("[v0] View on Solana Explorer: https://explorer.solana.com/tx/" + signature + "?cluster=devnet")

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      )

      console.log("[v0] Transaction confirmed! Registering in database...")

      const response = await fetch(`/api/tournaments/${params.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey,
          inGameUsername: "Player", // TODO: Get from profile
          transactionSignature: signature,
        }),
      })

      if (response.ok) {
        alert(
          `Successfully joined tournament!\n\nTransaction: ${signature.slice(0, 8)}...\n\nYour ${tournament.entryFee} SOL entry fee has been sent to the tournament escrow.`,
        )
        fetchTournamentDetails()
        fetchParticipants()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to register in database after payment")
      }
    } catch (error: any) {
      console.error("[v0] Error joining tournament:", error)

      if (error.message?.includes("User rejected") || error.message?.includes("cancelled")) {
        alert("Transaction cancelled")
      } else if (error.message?.includes("insufficient")) {
        alert("Insufficient SOL balance. You need at least 0.1 SOL + transaction fees to join.")
      } else {
        alert(`Failed to join tournament: ${error.message || "Unknown error"}`)
      }
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Tournament Not Found</CardTitle>
            <CardDescription>The tournament you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/tournaments")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isUserParticipating = participants.some((p) => p.player_wallet === publicKey)

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <Button onClick={() => router.push("/tournaments")} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tournaments
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-3xl">{tournament.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Gamepad2 className="w-4 h-4" />
                      <span>{tournament.game}</span>
                    </div>
                  </div>
                  <Badge
                    className={
                      tournament.status === "pending" || tournament.status === "open"
                        ? "bg-yellow-500"
                        : tournament.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-green-500"
                    }
                  >
                    {tournament.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Entry Fee</p>
                    <p className="text-2xl font-bold text-primary">{tournament.entryFee} SOL</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Prize Pool</p>
                    <p className="text-2xl font-bold text-green-500">{tournament.prizePool} SOL</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Participants
                    </p>
                    <p className="text-xl font-semibold">
                      {tournament.currentParticipants} / {tournament.maxParticipants}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Start Date
                    </p>
                    <p className="text-xl font-semibold">{new Date(tournament.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  {tournament.challonge?.url && (
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <a href={tournament.challonge.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Challonge
                      </a>
                    </Button>
                  )}

                  {tournament.status !== "completed" && !isUserParticipating && (
                    <Button
                      className="w-full bg-gradient-to-r from-primary to-orange-500 hover:opacity-90"
                      onClick={handleJoinTournament}
                      disabled={joining || !connected}
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {joining ? "Joining..." : connected ? "Join Tournament" : "Connect Wallet to Join"}
                    </Button>
                  )}

                  {isUserParticipating && (
                    <Badge className="w-full justify-center py-2 bg-green-500">You're Registered!</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participants ({participants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No participants yet</p>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant, index) => (
                      <div key={participant.id} className="flex items-center gap-2 p-2 rounded-lg border">
                        <span className="font-semibold text-muted-foreground">#{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {participant.in_game_username || participant.team_name || "Anonymous"}
                          </p>
                          {participant.discord_handle && (
                            <p className="text-xs text-muted-foreground">{participant.discord_handle}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
