import { Connection, PublicKey } from "@solana/web3.js"

const DEFAULT_RPC_URL = "https://api.devnet.solana.com"

export function getSolanaRpcUrl() {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || DEFAULT_RPC_URL
}

export function getTournamentProgramId(): { programId: PublicKey | null; error?: string; raw?: string } {
  const rawProgramId =
    process.env.NEXT_PUBLIC_TOURNAMENT_PROGRAM_ID ||
    process.env.SOLARENA_TOURNAMENT_PROGRAM_ID ||
    process.env.TOURNAMENT_PROGRAM_ID

  if (!rawProgramId) {
    return { programId: null, error: "Tournament program ID not set" }
  }

  try {
    return { programId: new PublicKey(rawProgramId), raw: rawProgramId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid program ID"
    return { programId: null, error: message, raw: rawProgramId }
  }
}

export function deriveEscrowPda(programId: PublicKey, tournamentId: string): PublicKey | null {
  try {
    const tournamentSeed = Buffer.from(tournamentId)
    const truncatedSeed = tournamentSeed.length > 32 ? tournamentSeed.subarray(0, 32) : tournamentSeed

    return PublicKey.findProgramAddressSync([Buffer.from("escrow"), truncatedSeed], programId)[0]
  } catch (error) {
    console.warn("[SolArena] Unable to derive escrow PDA:", error)
    return null
  }
}

export interface ProgramDeploymentStatus {
  deployed: boolean
  lamports: number
  owner?: string
}

export async function checkProgramDeployment(connection: Connection, programId: PublicKey): Promise<ProgramDeploymentStatus> {
  const info = await connection.getAccountInfo(programId)

  return {
    deployed: Boolean(info && info.executable),
    lamports: info?.lamports ?? 0,
    owner: info?.owner?.toBase58(),
  }
}
