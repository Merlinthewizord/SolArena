"use client"

import type React from "react"
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { useState, useEffect } from "react"
import { useWallet } from "@/components/wallet-provider"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Flame, Trophy, Gift, Users, Coins, Loader2, X } from "lucide-react"
import { Connection, PublicKey, Transaction } from "@solana/web3.js"
import { ARENA_TOKEN_MINT, ARENA_DECIMALS, calculatePrizeDistribution, getArenaBalance } from "@/lib/arena-token"

interface ArenaTournament {
  id: string
  name: string
  game: string
  entry_wager: number
  max_participants: number
  current_participants: number
  total_pot: number
  winner_amount: number
  giveaway_amount: number
  burn_amount: number
  status: string
  start_time: string
  match_format: string
  escrow_wallet: string
}

export function ArenaWagerSection() {
  const { publicKey, connected, signTransaction } = useWallet()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<ArenaTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<ArenaTournament | null>(null)
  const [arenaBalance, setArenaBalance] = useState(0)

  // Form states
  const [tournamentName, setTournamentName] = useState("")
  const [game, setGame] = useState("")
  const [entryWager, setEntryWager] = useState("100")
  const [maxParticipants, setMaxParticipants] = useState("100")
  const [startDate, setStartDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [matchFormat, setMatchFormat] = useState("best_of_7")

  const [inGameUsername, setInGameUsername] = useState("")
  const [discordHandle, setDiscordHandle] = useState("")
  const [teamName, setTeamName] = useState("")

  useEffect(() => {
    fetchTournaments()
  }, [])

  useEffect(() => {
    if (connected && publicKey) {
      fetchArenaBalance()
    }
  }, [connected, publicKey])

  const fetchArenaBalance = async () => {
    if (!publicKey) return

    console.log("[v0] Fetching balance for publicKey:", publicKey)
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=e45878a7-25fb-4b1a-9f3f-3ed1d643b319")
    const balance = await getArenaBalance(connection, new PublicKey(publicKey))
    console.log("[v0] Balance fetched:", balance, "$ARENA")
    setArenaBalance(balance)
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/arena-wager/tournaments")
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error("Error fetching ARENA tournaments:", error)
    } finally {
      setLoading(false)
    }
  }

  const createTournament = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a tournament",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      // Create escrow wallet for tournament (in production, use a PDA)
      const escrowWallet = PublicKey.unique().toString()

      const response = await fetch("/api/arena-wager/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tournamentName,
          game,
          entryWager: Number.parseFloat(entryWager),
          maxParticipants: Number.parseInt(maxParticipants),
          startTime: `${startDate}T${startTime}`,
          escrowWallet,
          creatorWallet: publicKey,
          matchFormat,
        }),
      })

      if (!response.ok) throw new Error("Failed to create tournament")

      toast({
        title: "Tournament created!",
        description: `${tournamentName} is ready for players to wager and join`,
      })

      setShowCreateForm(false)
      setTournamentName("")
      setGame("")
      setEntryWager("100")
      setMaxParticipants("100")
      setStartDate("")
      setStartTime("")
      fetchTournaments()
    } catch (error) {
      console.error("Error creating tournament:", error)
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const joinTournament = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Join tournament button clicked!")
    console.log("[v0] Wallet connected:", connected)
    console.log("[v0] Public key:", publicKey)
    console.log("[v0] SignTransaction available:", !!signTransaction)
    console.log("[v0] Selected tournament:", selectedTournament)

    if (!connected || !publicKey || !signTransaction || !selectedTournament) {
      console.log("[v0] Validation failed:", {
        connected,
        hasPublicKey: !!publicKey,
        hasSignTransaction: !!signTransaction,
        hasTournament: !!selectedTournament,
      })
      toast({
        title: "Not ready",
        description: "Please ensure your wallet is connected",
        variant: "destructive",
      })
      return
    }

    if (arenaBalance < selectedTournament.entry_wager) {
      console.log("[v0] Insufficient balance:", arenaBalance, "need:", selectedTournament.entry_wager)
      toast({
        title: "Insufficient ARENA tokens",
        description: `You need ${selectedTournament.entry_wager} $ARENA to join this tournament`,
        variant: "destructive",
      })
      return
    }

    setJoining(true)

    try {
      console.log("[v0] Starting ARENA wager transaction for", selectedTournament.entry_wager, "$ARENA")

      const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=e45878a7-25fb-4b1a-9f3f-3ed1d643b319")
      const playerPubkey = new PublicKey(publicKey)
      const escrowPubkey = new PublicKey(selectedTournament.escrow_wallet)

      console.log("[v0] Player wallet:", playerPubkey.toBase58())
      console.log("[v0] Escrow wallet:", escrowPubkey.toBase58())

      // Get token accounts
      const playerTokenAccount = await getAssociatedTokenAddress(ARENA_TOKEN_MINT, playerPubkey)
      const escrowTokenAccount = await getAssociatedTokenAddress(ARENA_TOKEN_MINT, escrowPubkey)

      console.log("[v0] Player token account:", playerTokenAccount.toBase58())
      console.log("[v0] Escrow token account:", escrowTokenAccount.toBase58())

      // Check if escrow token account exists, if not create it
      const escrowAccountInfo = await connection.getAccountInfo(escrowTokenAccount)

      const transaction = new Transaction()

      if (!escrowAccountInfo) {
        console.log("[v0] Creating escrow token account...")
        transaction.add(
          createAssociatedTokenAccountInstruction(
            playerPubkey, // Payer
            escrowTokenAccount, // Associated token account
            escrowPubkey, // Owner
            ARENA_TOKEN_MINT, // Mint
          ),
        )
      }

      // Create transfer instruction
      const amountToTransfer = Math.floor(selectedTournament.entry_wager * Math.pow(10, ARENA_DECIMALS))
      console.log("[v0] Transfer amount (smallest units):", amountToTransfer)

      transaction.add(
        createTransferInstruction(
          playerTokenAccount,
          escrowTokenAccount,
          playerPubkey,
          amountToTransfer,
          [],
          TOKEN_PROGRAM_ID,
        ),
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = playerPubkey

      console.log("[v0] Transaction prepared, requesting wallet signature...")

      // Sign and send transaction
      const signedTx = await signTransaction(transaction)
      if (!signedTx) throw new Error("Transaction signing failed")

      console.log("[v0] Transaction signed, sending to network...")

      const signature = await connection.sendRawTransaction(signedTx.serialize())

      console.log("[v0] Transaction sent, confirming... Signature:", signature)

      await connection.confirmTransaction(signature)

      console.log("[v0] Wager transaction confirmed:", signature)

      // Register with backend
      const response = await fetch(`/api/arena-wager/tournaments/${selectedTournament.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerWallet: publicKey,
          wagerAmount: selectedTournament.entry_wager,
          wagerTxSignature: signature,
          inGameUsername,
          discordHandle,
          teamName,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to register: ${error}`)
      }

      toast({
        title: "Successfully joined!",
        description: `You've wagered ${selectedTournament.entry_wager} $ARENA tokens. Transaction: ${signature.slice(0, 8)}...`,
      })

      setShowJoinModal(false)
      setInGameUsername("")
      setDiscordHandle("")
      setTeamName("")
      fetchTournaments()
      fetchArenaBalance()
    } catch (error) {
      console.error("[v0] Error joining tournament:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join tournament",
        variant: "destructive",
      })
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Coins className="w-8 h-8 text-primary" />
            ARENA Token Wager Tournaments
          </h2>
          <p className="text-muted-foreground">Wager $ARENA tokens in battle royale tournaments</p>
          {connected && (
            <p className="text-sm">
              Your $ARENA Balance: <span className="font-bold text-primary">{arenaBalance.toFixed(2)}</span>
            </p>
          )}
        </div>
        <Button onClick={() => setShowCreateForm(true)} disabled={!connected}>
          <Trophy className="w-4 h-4 mr-2" />
          Create Wager Tournament
        </Button>
      </div>

      {/* Prize Distribution Info */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-background border-primary/20">
        <h3 className="font-bold text-lg mb-4">Prize Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Trophy className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-bold">50% to Winner</p>
              <p className="text-sm text-muted-foreground">Best player takes half the pot</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Gift className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-bold">25% for Giveaways</p>
              <p className="text-sm text-muted-foreground">Community rewards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="font-bold">25% Burned</p>
              <p className="text-sm text-muted-foreground">Creating scarcity</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tournament List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p>Loading tournaments...</p>
        ) : tournaments.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No wager tournaments available. Create one to get started!
          </p>
        ) : (
          tournaments.map((tournament) => {
            const distribution = calculatePrizeDistribution(tournament.total_pot)
            return (
              <Card key={tournament.id} className="p-6 space-y-4 border-primary/20">
                <div>
                  <h3 className="font-bold text-xl">{tournament.name}</h3>
                  <p className="text-sm text-muted-foreground">{tournament.game}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tournament.match_format.replace("_", " ")}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Wager</span>
                    <span className="font-bold">{tournament.entry_wager} $ARENA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Pot</span>
                    <span className="font-bold text-primary">{tournament.total_pot.toFixed(2)} $ARENA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      Players
                    </span>
                    <span>
                      {tournament.current_participants}/{tournament.max_participants}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-green-500" />
                      Winner
                    </span>
                    <span className="font-bold text-green-500">{distribution.winnerAmount.toFixed(2)} $ARENA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Gift className="w-3 h-3 text-blue-500" />
                      Giveaways
                    </span>
                    <span className="font-bold text-blue-500">{distribution.giveawayAmount.toFixed(2)} $ARENA</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      Burn
                    </span>
                    <span className="font-bold text-orange-500">{distribution.burnAmount.toFixed(2)} $ARENA</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!connected || tournament.status !== "registration"}
                  onClick={() => {
                    setSelectedTournament(tournament)
                    setShowJoinModal(true)
                  }}
                >
                  {tournament.status === "registration" ? "Wager & Join" : tournament.status.toUpperCase()}
                </Button>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateForm(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={createTournament} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Create Wager Tournament</h3>
                <p className="text-muted-foreground">Players wager $ARENA tokens to compete</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="tournamentName">Tournament Name *</Label>
                  <Input
                    id="tournamentName"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="game">Game *</Label>
                  <Input id="game" value={game} onChange={(e) => setGame(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="entryWager">Entry Wager ($ARENA) *</Label>
                    <Input
                      id="entryWager"
                      type="number"
                      step="0.01"
                      value={entryWager}
                      onChange={(e) => setEntryWager(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Max Players *</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={maxParticipants}
                      onChange={(e) => setMaxParticipants(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="matchFormat">Format *</Label>
                  <select
                    id="matchFormat"
                    value={matchFormat}
                    onChange={(e) => setMatchFormat(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    <option value="best_of_1">Best of 1</option>
                    <option value="best_of_3">Best of 3</option>
                    <option value="best_of_5">Best of 5</option>
                    <option value="best_of_7">Best of 7</option>
                  </select>
                </div>
              </div>

              <Button type="submit" disabled={creating} className="w-full">
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Tournament"
                )}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Join Tournament Modal */}
      {showJoinModal && selectedTournament && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <form onSubmit={joinTournament} className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Join Tournament</h3>
                <p className="text-muted-foreground">{selectedTournament.name}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Entry Wager</span>
                  <span className="font-bold">{selectedTournament.entry_wager} $ARENA</span>
                </div>
                <div className="flex justify-between">
                  <span>Your Balance</span>
                  <span className="font-bold">{arenaBalance.toFixed(2)} $ARENA</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="inGameUsername">In-Game Username *</Label>
                  <Input
                    id="inGameUsername"
                    value={inGameUsername}
                    onChange={(e) => setInGameUsername(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="discordHandle">Discord Handle</Label>
                  <Input id="discordHandle" value={discordHandle} onChange={(e) => setDiscordHandle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="teamName">Team Name (if applicable)</Label>
                  <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                </div>
              </div>

              <Button type="submit" disabled={joining} className="w-full">
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Wager...
                  </>
                ) : (
                  `Wager ${selectedTournament.entry_wager} $ARENA & Join`
                )}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
