import { Connection, type PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"

export const ENTRY_FEE = 0.1 * LAMPORTS_PER_SOL // 0.1 SOL

export interface Tournament {
  tournamentId: string
  entryFee: number
  totalPool: number
  participants: string[]
  isFinalized: boolean
}

export class SolArenaProgram {
  private connection: Connection
  private tournaments: Map<string, Tournament> = new Map()

  constructor(rpcUrl = "https://api.devnet.solana.com") {
    this.connection = new Connection(rpcUrl, "confirmed")
  }

  async initialize(wallet: any) {
    if (!wallet || !wallet.publicKey) {
      console.log("[v0] SolArena program initialized without wallet")
      return
    }
    console.log("[v0] SolArena program initialized with wallet:", wallet.publicKey.toString())
  }

  async createTournament(wallet: any, tournamentId: string, entryFee: number = ENTRY_FEE) {
    console.log("[v0] Creating tournament:", tournamentId)

    const tournament: Tournament = {
      tournamentId,
      entryFee,
      totalPool: 0,
      participants: [],
      isFinalized: false,
    }

    this.tournaments.set(tournamentId, tournament)

    return {
      signature: `simulated-create-${tournamentId}`,
      tournamentPDA: wallet.publicKey,
      escrowPDA: wallet.publicKey,
    }
  }

  async registerForTournament(wallet: any, tournamentId: string) {
    console.log("[v0] Registering for tournament:", tournamentId)

    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) {
      throw new Error("Tournament not found")
    }

    // In production, you'd use a dedicated escrow PDA from the on-chain program
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: wallet.publicKey, // Temporarily using same wallet for demo
        lamports: ENTRY_FEE,
      }),
    )

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = wallet.publicKey

    // Sign and send transaction
    const signed = await wallet.signTransaction(transaction)
    const signature = await this.connection.sendRawTransaction(signed.serialize())
    await this.connection.confirmTransaction(signature)

    // Update tournament data
    tournament.participants.push(wallet.publicKey.toString())
    tournament.totalPool += ENTRY_FEE

    console.log("[v0] Registration successful, signature:", signature)

    return { signature }
  }

  async finalizeTournament(
    wallet: any,
    tournamentId: string,
    firstPlace: PublicKey,
    secondPlace: PublicKey,
    thirdPlace: PublicKey,
  ) {
    console.log("[v0] Finalizing tournament:", tournamentId)

    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) {
      throw new Error("Tournament not found")
    }

    tournament.isFinalized = true

    return {
      signature: `simulated-finalize-${tournamentId}`,
      winners: {
        first: firstPlace.toString(),
        second: secondPlace.toString(),
        third: thirdPlace.toString(),
      },
    }
  }

  async claimPrize(wallet: any, tournamentId: string, payoutAmount: number, escrowWallet: any) {
    console.log("[v0] Claiming prize:", payoutAmount / LAMPORTS_PER_SOL, "SOL")

    // Create a real SOL transfer from escrow to winner
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet.publicKey,
        toPubkey: wallet.publicKey,
        lamports: payoutAmount,
      }),
    )

    // Get recent blockhash
    const { blockhash } = await this.connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = escrowWallet.publicKey

    // Sign with escrow wallet and send
    const signed = await escrowWallet.signTransaction(transaction)
    const signature = await this.connection.sendRawTransaction(signed.serialize())
    await this.connection.confirmTransaction(signature)

    console.log("[v0] Prize claimed, signature:", signature)

    return { signature }
  }

  async getTournamentData(tournamentId: string): Promise<Tournament | null> {
    return this.tournaments.get(tournamentId) || null
  }
}

// Utility function to convert lamports to SOL
export function lamportsToSol(lamports: number): number {
  return lamports / LAMPORTS_PER_SOL
}

// Utility function to convert SOL to lamports
export function solToLamports(sol: number): number {
  return sol * LAMPORTS_PER_SOL
}
