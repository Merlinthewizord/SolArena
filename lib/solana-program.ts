import { Connection, type PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from "@solana/web3.js"
import {
  deriveEscrowPda,
  getSolanaRpcUrl,
  getTournamentProgramId,
  checkProgramDeployment,
  type ProgramDeploymentStatus,
} from "./solana/config"

export const ENTRY_FEE = 0.1 * LAMPORTS_PER_SOL // 0.1 SOL

export interface Tournament {
  tournamentId: string
  entryFee: number // lamports
  totalPool: number // lamports
  participants: string[]
  isFinalized: boolean
}

export class SolArenaProgram {
  private connection: Connection
  private tournaments: Map<string, Tournament> = new Map()
  private programId = getTournamentProgramId()
  private programStatus: ProgramDeploymentStatus | null = null

  constructor(rpcUrl = getSolanaRpcUrl()) {
    this.connection = new Connection(rpcUrl, "confirmed")
  }

  async initialize(wallet: any) {
    if (this.programId.programId) {
      this.programStatus = await checkProgramDeployment(this.connection, this.programId.programId)
      console.log("[v0] Tournament program status:", this.programStatus)
    } else {
      console.warn("[v0] Tournament program ID missing or invalid:", this.programId.error || this.programId.raw)
    }

    if (wallet?.publicKey) {
      console.log("[v0] SolArena program initialized with wallet:", wallet.publicKey.toString())
    } else {
      console.log("[v0] SolArena program initialized without wallet")
    }
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

    const escrowPDA =
      this.programId.programId && this.programStatus?.deployed
        ? deriveEscrowPda(this.programId.programId, tournamentId)
        : null

    return {
      signature: `simulated-create-${tournamentId}`,
      tournamentPDA: wallet.publicKey,
      escrowPDA: escrowPDA ?? wallet.publicKey,
      programId: this.programId.raw ?? null,
      programReady: Boolean(this.programId.programId && this.programStatus?.deployed),
    }
  }

  private async resolveEscrowDestination(tournamentId: string, fallback: PublicKey) {
    if (this.programId.programId) {
      const escrowPDA = deriveEscrowPda(this.programId.programId, tournamentId)
      if (escrowPDA) {
        const escrowInfo = await this.connection.getAccountInfo(escrowPDA)
        if (escrowInfo) {
          return { destination: escrowPDA, viaProgram: true }
        }
      }
      // Fallback to program account if PDA not available yet
      return { destination: this.programId.programId, viaProgram: true }
    }

    return { destination: fallback, viaProgram: false }
  }

  async registerForTournament(wallet: any, tournamentId: string, entryFeeLamports: number = ENTRY_FEE) {
    console.log("[v0] Registering for tournament:", tournamentId)

    let tournament = this.tournaments.get(tournamentId)
    if (!tournament) {
      tournament = {
        tournamentId,
        entryFee: entryFeeLamports,
        totalPool: 0,
        participants: [],
        isFinalized: false,
      }
      this.tournaments.set(tournamentId, tournament)
    }

    const { destination, viaProgram } = await this.resolveEscrowDestination(tournamentId, wallet.publicKey)

    // In production, this would call the program; here we at least ensure the SOL moves into the escrow/program account
    const transferIx = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: destination,
      lamports: entryFeeLamports,
    })

    const transaction = new Transaction().add(transferIx)

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
    tournament.totalPool += entryFeeLamports

    console.log("[v0] Registration successful, signature:", signature)

    return {
      signature,
      escrowAddress: destination.toBase58(),
      depositedToProgram: viaProgram,
    }
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

  getProgramStatus() {
    return {
      configuredProgramId: this.programId.raw ?? null,
      programIdValid: Boolean(this.programId.programId),
      deploymentChecked: Boolean(this.programStatus),
      deployedOnCluster: this.programStatus?.deployed ?? false,
      lamports: this.programStatus?.lamports ?? 0,
      owner: this.programStatus?.owner ?? null,
      rpcUrl: (this.connection as any)._rpcEndpoint,
    }
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
