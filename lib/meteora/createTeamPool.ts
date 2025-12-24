import type { Connection, Keypair } from "@solana/web3.js"
import { PublicKey, Keypair as SolanaKeypair } from "@solana/web3.js"
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk"
import { METEORA_DBC_PROGRAM_ID } from "../dbc-config"

export interface CreateTeamPoolParams {
  connection: Connection
  serverKeypair: Keypair
  poolConfigKey: PublicKey
  name: string
  symbol: string
  metadataUri: string
  teamId: string
}

export interface CreateTeamPoolResult {
  mintAddress: string
  poolAddress: string
  bondingCurveAddress: string
  txSignature: string
}

export async function createTeamPool(params: CreateTeamPoolParams): Promise<CreateTeamPoolResult> {
  const { connection, serverKeypair, poolConfigKey, name, symbol, metadataUri, teamId } = params

  console.log("[Create Team Pool] Starting pool creation for team:", teamId)
  console.log("[Create Team Pool] Pool config:", poolConfigKey.toBase58())
  console.log("[Create Team Pool] Token name:", name)
  console.log("[Create Team Pool] Token symbol:", symbol)
  console.log("[Create Team Pool] Metadata URI:", metadataUri)

  const nameBytes = Buffer.byteLength(name, "utf8")
  const symbolBytes = Buffer.byteLength(symbol, "utf8")
  const uriBytes = Buffer.byteLength(metadataUri, "utf8")

  if (nameBytes > 32) {
    throw new Error(`Token name exceeds 32 bytes: ${nameBytes} bytes`)
  }
  if (symbolBytes > 10) {
    throw new Error(`Token symbol exceeds 10 bytes: ${symbolBytes} bytes`)
  }
  if (uriBytes > 200) {
    throw new Error(`Metadata URI exceeds 200 bytes: ${uriBytes} bytes`)
  }

  console.log("[Create Team Pool] Initializing DBC client...")
  const dbcClient = new DynamicBondingCurveClient(connection, "confirmed")

  try {
    console.log("[Create Team Pool] Verifying pool config exists...")
    const poolConfig = await connection.getAccountInfo(poolConfigKey)
    if (!poolConfig) {
      throw new Error(`Pool config not found at ${poolConfigKey.toBase58()}`)
    }

    console.log("[Create Team Pool] Generating mint keypair...")
    const baseMintKeypair = SolanaKeypair.generate()

    console.log("[Create Team Pool] Creating DBC pool...")
    const createPoolParam = {
      baseMint: baseMintKeypair.publicKey,
      config: poolConfigKey,
      name,
      symbol,
      uri: metadataUri,
      payer: serverKeypair.publicKey,
      poolCreator: serverKeypair.publicKey,
    }

    console.log("[Create Team Pool] Building pool creation transaction...")
    const poolTransaction = await dbcClient.pool.createPool(createPoolParam)

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
    poolTransaction.recentBlockhash = blockhash
    poolTransaction.feePayer = serverKeypair.publicKey

    poolTransaction.partialSign(baseMintKeypair)
    poolTransaction.partialSign(serverKeypair)

    console.log("[Create Team Pool] Sending transaction...")
    const signature = await connection.sendRawTransaction(poolTransaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    })

    console.log("[Create Team Pool] Transaction sent, signature:", signature)
    console.log("[Create Team Pool] Confirming transaction...")

    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    )

    console.log("[Create Team Pool] Transaction confirmed!")

    const [poolAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("virtual_pool"), poolConfigKey.toBuffer(), baseMintKeypair.publicKey.toBuffer()],
      METEORA_DBC_PROGRAM_ID,
    )

    const [bondingCurveAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), poolAddress.toBuffer()],
      METEORA_DBC_PROGRAM_ID,
    )

    console.log("[Create Team Pool] Pool created successfully!")
    console.log("[Create Team Pool] Mint:", baseMintKeypair.publicKey.toBase58())
    console.log("[Create Team Pool] Pool:", poolAddress.toBase58())
    console.log("[Create Team Pool] Bonding Curve:", bondingCurveAddress.toBase58())
    console.log("[Create Team Pool] Transaction:", signature)

    return {
      mintAddress: baseMintKeypair.publicKey.toBase58(),
      poolAddress: poolAddress.toBase58(),
      bondingCurveAddress: bondingCurveAddress.toBase58(),
      txSignature: signature,
    }
  } catch (error: any) {
    console.error("[Create Team Pool] Error:", error)
    throw new Error(`Failed to create team pool: ${error.message || error}`)
  }
}
