import { type Connection, Keypair, PublicKey, type Transaction } from "@solana/web3.js"
import { DBC_CONFIG_ADDRESS, METEORA_DBC_PROGRAM_ID } from "./dbc-config"
import { createSolanaConnection } from "./meteora/connection"

// Re-export the new Meteora Invent architecture
export { TeamTokenLauncher } from "./meteora/team-token-launcher"
export type { TeamTokenConfig, TeamTokenLaunchResult } from "./meteora/team-token-launcher"

// Types for team token creation
export interface CreateTeamTokenParams {
  teamName: string
  symbol: string
  description: string
  imageUri: string
  creatorWallet: PublicKey
  payerWallet: PublicKey
}

export interface TeamTokenResult {
  teamMint: string
  poolAddress?: string
  bondingCurveAddress?: string
  transactionSignature: string
  usedDBC: boolean
}

/**
 * Create a team token using Meteora DBC
 */
export async function createTeamToken(
  connection: Connection,
  params: CreateTeamTokenParams,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
): Promise<TeamTokenResult> {
  try {
    console.log("[v0] Starting team token creation...")

    // Check if the DBC config exists
    console.log("[v0] Checking DBC config availability...")
    const configAccount = await connection.getAccountInfo(DBC_CONFIG_ADDRESS)

    if (!configAccount) {
      throw new Error("DBC config not found. Team tokens require DBC bonding curves.")
    }

    console.log("[v0] DBC config found, attempting to create DBC pool...")
    return await createDBCToken(connection, params, signTransaction)
  } catch (error) {
    console.error("[v0] Error in createTeamToken:", error)
    throw error
  }
}

/**
 * Create a token using Meteora DBC (bonding curve)
 */
async function createDBCToken(
  connection: Connection,
  params: CreateTeamTokenParams,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
): Promise<TeamTokenResult> {
  console.log("[v0] Creating team token with Meteora DBC:", params)

  // Dynamically import the SDK (only loads when needed)
  const { DynamicBondingCurveClient } = await import("@meteora-ag/dynamic-bonding-curve-sdk")

  // Initialize DBC client
  const client = new DynamicBondingCurveClient(connection, "confirmed")

  // Generate new mint keypair for the team token
  const baseMint = Keypair.generate()
  console.log(`[v0] Generated team token mint: ${baseMint.publicKey.toString()}`)

  // Create pool parameters
  const createPoolParam = {
    baseMint: baseMint.publicKey,
    config: DBC_CONFIG_ADDRESS,
    name: params.teamName,
    symbol: params.symbol,
    uri: params.imageUri,
    payer: params.payerWallet,
    poolCreator: params.creatorWallet,
  }

  // Create the pool transaction
  console.log("[v0] Building create pool transaction...")
  const poolTransaction = await client.pool.createPool(createPoolParam)

  // Get latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
  poolTransaction.recentBlockhash = blockhash
  poolTransaction.feePayer = params.payerWallet

  // Sign with base mint keypair
  poolTransaction.partialSign(baseMint)

  // Sign with user wallet via Phantom
  console.log("[v0] Requesting wallet signature...")
  const signedTransaction = await signTransaction(poolTransaction)

  // Send and confirm transaction
  console.log("[v0] Sending transaction to Solana...")
  const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
    skipPreflight: false,
    maxRetries: 3,
  })

  console.log("[v0] Confirming transaction...")
  await connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    "confirmed",
  )

  console.log(`[v0] Team token created successfully with DBC! Signature: ${signature}`)

  // Derive the pool address (PDA from config and base mint)
  const [poolAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("virtual_pool"), DBC_CONFIG_ADDRESS.toBuffer(), baseMint.publicKey.toBuffer()],
    METEORA_DBC_PROGRAM_ID,
  )

  // Derive bonding curve address (PDA from pool)
  const [bondingCurveAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding_curve"), poolAddress.toBuffer()],
    METEORA_DBC_PROGRAM_ID,
  )

  return {
    teamMint: baseMint.publicKey.toString(),
    poolAddress: poolAddress.toString(),
    bondingCurveAddress: bondingCurveAddress.toString(),
    transactionSignature: signature,
    usedDBC: true,
  }
}

// Backward compatibility exports
export { createSolanaConnection as getSolanaConnection }
