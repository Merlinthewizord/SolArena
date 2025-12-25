import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js"

export const ENTRY_FEE = 0.1 * LAMPORTS_PER_SOL // 0.1 SOL

export const PROGRAM_ID = process.env.NEXT_PUBLIC_TOURNAMENT_PROGRAM_ID || "SoLArenaTournament111111111111111111111111"

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

    // Create instruction
    const instruction = await createCreateTournamentInstruction(
      this.connection,
      PROGRAM_ID,
      tournamentId,
      entryFee,
      wallet.publicKey,
    )

    // Create transaction
    const transaction = instruction.transaction

    // Sign and send transaction
    const signed = await wallet.signTransaction(transaction)
    const signature = await this.connection.sendRawTransaction(signed.serialize())
    await this.connection.confirmTransaction(signature)

    console.log("[v0] Tournament created, signature:", signature)

    return {
      signature,
      tournamentPDA: instruction.tournamentPDA,
      escrowPDA: instruction.escrowPDA,
    }
  }

  async registerForTournament(wallet: any, tournamentId: string) {
    console.log("[v0] Registering for tournament:", tournamentId)

    const tournament = this.tournaments.get(tournamentId)
    if (!tournament) {
      throw new Error("Tournament not found")
    }

    // Derive PDAs
    const { tournamentPDA, escrowPDA } = await deriveTournamentPDAs(PROGRAM_ID, tournamentId)

    // Create instruction
    const instruction = await createRegisterForTournamentInstruction(
      this.connection,
      PROGRAM_ID,
      tournamentId,
      wallet.publicKey,
    )

    // Create transaction
    const transaction = instruction.transaction

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

export async function createRegisterForTournamentInstruction(
  connection: Connection,
  programId: string,
  tournamentId: string,
  playerPubkey: PublicKey,
): Promise<{ transaction: Transaction; tournamentPDA: PublicKey; escrowPDA: PublicKey }> {
  // Derive PDAs - Use tournament ID directly without hashing
  const { tournamentPDA, escrowPDA } = await deriveTournamentPDAs(programId, tournamentId)

  // Anchor discriminator is first 8 bytes of sha256("global:register_for_tournament")
  const instructionName = "global:register_for_tournament"
  const encoder = new TextEncoder()
  const nameBuffer = encoder.encode(instructionName)
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", nameBuffer)
  const discriminator = new Uint8Array(hashBuffer).slice(0, 8)

  // Encode tournament_id as string (4 byte length prefix + string bytes)
  const tournamentIdBytes = encoder.encode(tournamentId)
  const tournamentIdLen = Buffer.alloc(4)
  tournamentIdLen.writeUInt32LE(tournamentIdBytes.length, 0)

  const data = Buffer.concat([Buffer.from(discriminator), tournamentIdLen, Buffer.from(tournamentIdBytes)])

  console.log("[v0] Instruction discriminator:", Buffer.from(discriminator).toString("hex"))
  console.log("[v0] Tournament ID:", tournamentId)

  const keys = [
    { pubkey: tournamentPDA, isSigner: false, isWritable: true },
    { pubkey: escrowPDA, isSigner: false, isWritable: true },
    { pubkey: playerPubkey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]

  const instruction = new TransactionInstruction({
    keys,
    programId: new PublicKey(programId),
    data,
  })

  const transaction = new Transaction().add(instruction)

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = playerPubkey

  return { transaction, tournamentPDA, escrowPDA }
}

export async function deriveTournamentPDAs(
  programId: string,
  tournamentId: string,
): Promise<{ tournamentPDA: PublicKey; escrowPDA: PublicKey }> {
  const encoder = new TextEncoder()
  const tournamentIdBytes = encoder.encode(tournamentId)

  // Hash to get a fixed 32-byte value
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", tournamentIdBytes)
  const tournamentIdHash = new Uint8Array(hashBuffer)

  const [tournamentPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("tournament"), Buffer.from(tournamentIdHash)],
    new PublicKey(programId),
  )

  const [escrowPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), Buffer.from(tournamentIdHash)],
    new PublicKey(programId),
  )

  console.log("[v0] Derived Tournament PDA:", tournamentPDA.toString())
  console.log("[v0] Derived Escrow PDA:", escrowPDA.toString())

  return { tournamentPDA, escrowPDA }
}

export async function createCreateTournamentInstruction(
  connection: Connection,
  programId: string,
  tournamentId: string,
  entryFee: number,
  authorityPubkey: PublicKey,
): Promise<{ transaction: Transaction; tournamentPDA: PublicKey; escrowPDA: PublicKey }> {
  // Derive PDAs
  const { tournamentPDA, escrowPDA } = await deriveTournamentPDAs(programId, tournamentId)

  const instructionName = "global:create_tournament"
  const encoder = new TextEncoder()
  const nameBuffer = encoder.encode(instructionName)
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", nameBuffer)
  const discriminator = new Uint8Array(hashBuffer).slice(0, 8)

  // Encode instruction data: tournament_id (String) + entry_fee (u64)
  const tournamentIdBytes = encoder.encode(tournamentId)
  const tournamentIdLen = Buffer.alloc(4)
  tournamentIdLen.writeUInt32LE(tournamentIdBytes.length, 0)

  const entryFeeBuffer = Buffer.alloc(8)
  entryFeeBuffer.writeBigUInt64LE(BigInt(entryFee), 0)

  const data = Buffer.concat([
    Buffer.from(discriminator),
    tournamentIdLen,
    Buffer.from(tournamentIdBytes),
    entryFeeBuffer,
  ])

  console.log("[v0] Create tournament discriminator:", Buffer.from(discriminator).toString("hex"))
  console.log("[v0] Creating tournament:", tournamentId, "with entry fee:", entryFee)

  const keys = [
    { pubkey: tournamentPDA, isSigner: false, isWritable: true },
    { pubkey: escrowPDA, isSigner: false, isWritable: false },
    { pubkey: authorityPubkey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]

  const instruction = new TransactionInstruction({
    keys,
    programId: new PublicKey(programId),
    data,
  })

  const transaction = new Transaction().add(instruction)

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = authorityPubkey

  return { transaction, tournamentPDA, escrowPDA }
}
