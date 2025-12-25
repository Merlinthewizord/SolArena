import type { Connection } from "@solana/web3.js"
import { PublicKey, Keypair as SolanaKeypair } from "@solana/web3.js"
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk"
import { METEORA_DBC_PROGRAM_ID } from "../dbc-config"

export interface CreateTeamPoolParams {
  connection: Connection
  poolConfigKey: PublicKey
  name: string
  symbol: string
  metadataUri: string
  teamId: string
  userWallet: PublicKey
}

export interface CreateTeamPoolResult {
  mintAddress: string
  poolAddress: string
  bondingCurveAddress: string
  serializedTransaction: string
  blockhash: string
  lastValidBlockHeight: number
}

export async function createTeamPool(params: CreateTeamPoolParams): Promise<CreateTeamPoolResult> {
  const { connection, poolConfigKey, name, symbol, metadataUri, teamId, userWallet } = params

  console.log("[Create Team Pool] Using RPC endpoint:", connection.rpcEndpoint)
  console.log("[Create Team Pool] Starting pool creation for team:", teamId)
  console.log("[Create Team Pool] Pool config:", poolConfigKey.toBase58())
  console.log("[Create Team Pool] DBC Program ID:", METEORA_DBC_PROGRAM_ID.toBase58())
  console.log("[Create Team Pool] Token name:", name)
  console.log("[Create Team Pool] Token symbol:", symbol)
  console.log("[Create Team Pool] Metadata URI:", metadataUri)
  console.log("[Create Team Pool] User wallet (payer):", userWallet.toBase58())

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
      throw new Error(
        `Pool config account not found at ${poolConfigKey.toBase58()}. Please verify the DBC_CONFIG_ADDRESS is correct.`,
      )
    }

    console.log("[Create Team Pool] Pool config found:")
    console.log("  - Owner:", poolConfig.owner.toBase58())
    console.log("  - Data length:", poolConfig.data.length, "bytes")
    console.log("  - Lamports:", poolConfig.lamports)

    if (!poolConfig.owner.equals(METEORA_DBC_PROGRAM_ID)) {
      throw new Error(
        `Pool config account is not owned by DBC program. Expected: ${METEORA_DBC_PROGRAM_ID.toBase58()}, Got: ${poolConfig.owner.toBase58()}`,
      )
    }

    console.log("[Create Team Pool] Generating mint keypair...")
    const baseMintKeypair = SolanaKeypair.generate()
    console.log("[Create Team Pool] Base mint:", baseMintKeypair.publicKey.toBase58())

    console.log("[Create Team Pool] Creating DBC pool...")
    const createPoolParam = {
      baseMint: baseMintKeypair.publicKey,
      config: poolConfigKey,
      name,
      symbol,
      uri: metadataUri,
      payer: userWallet,
      poolCreator: userWallet,
    }

    console.log("[Create Team Pool] Calling dbcClient.pool.createPool...")
    const poolTransaction = await dbcClient.pool.createPool(createPoolParam)

    console.log("[Create Team Pool] Transaction created, setting blockhash and fee payer...")
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
    poolTransaction.recentBlockhash = blockhash
    poolTransaction.feePayer = userWallet

    console.log("[Create Team Pool] Signing with mint keypair...")
    poolTransaction.partialSign(baseMintKeypair)

    console.log("[Create Team Pool] Deriving pool PDAs...")
    const [poolAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("virtual_pool"), poolConfigKey.toBuffer(), baseMintKeypair.publicKey.toBuffer()],
      METEORA_DBC_PROGRAM_ID,
    )

    const [bondingCurveAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), poolAddress.toBuffer()],
      METEORA_DBC_PROGRAM_ID,
    )

    console.log("[Create Team Pool] Serializing transaction for user to sign...")
    const serializedTx = poolTransaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })

    console.log("[Create Team Pool] Pool creation transaction prepared successfully!")
    console.log("[Create Team Pool] Mint:", baseMintKeypair.publicKey.toBase58())
    console.log("[Create Team Pool] Pool:", poolAddress.toBase58())
    console.log("[Create Team Pool] Bonding Curve:", bondingCurveAddress.toBase58())

    return {
      mintAddress: baseMintKeypair.publicKey.toBase58(),
      poolAddress: poolAddress.toBase58(),
      bondingCurveAddress: bondingCurveAddress.toBase58(),
      serializedTransaction: Buffer.from(serializedTx).toString("base64"),
      blockhash,
      lastValidBlockHeight,
    }
  } catch (error: any) {
    console.error("[Create Team Pool] Error:", error)
    console.error("[Create Team Pool] Error stack:", error.stack)
    throw new Error(`Failed to create team pool: ${error.message || error}`)
  }
}
