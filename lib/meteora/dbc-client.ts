import { type Connection, PublicKey, type Keypair, type Transaction } from "@solana/web3.js"
import { DynamicBondingCurveClient } from "@meteora-ag/dynamic-bonding-curve-sdk"
import { METEORA_DBC_PROGRAM_ID } from "../dbc-config"

export interface DBCPoolParams {
  baseMint: Keypair
  config: PublicKey
  name: string
  symbol: string
  uri: string
  payer: PublicKey
  poolCreator: PublicKey
}

export interface DBCPoolResult {
  poolAddress: string
  baseMint: string
  bondingCurveAddress: string
  transactionSignature: string
}

export class MeteoraDBCService {
  private client: DynamicBondingCurveClient

  constructor(connection: Connection, commitment: "confirmed" | "finalized" = "confirmed") {
    this.client = new DynamicBondingCurveClient(connection, commitment)
  }

  async createPool(
    params: DBCPoolParams,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
  ): Promise<DBCPoolResult> {
    const nameBytes = Buffer.byteLength(params.name, "utf8")
    const symbolBytes = Buffer.byteLength(params.symbol, "utf8")
    const uriBytes = Buffer.byteLength(params.uri, "utf8")

    if (nameBytes > 32) {
      throw new Error(`Token name too long (${nameBytes} bytes). Maximum is 32 bytes. Current: "${params.name}"`)
    }
    if (symbolBytes > 10) {
      throw new Error(`Token symbol too long (${symbolBytes} bytes). Maximum is 10 bytes. Current: "${params.symbol}"`)
    }
    if (uriBytes > 200) {
      throw new Error(
        `Metadata URI too long (${uriBytes} bytes). Maximum is 200 bytes. ` +
          `Current URI is ${uriBytes} bytes. Use a hosted URL (IPFS/Arweave) instead of a data URI.`,
      )
    }

    console.log("[Meteora DBC] Creating pool with params:", {
      baseMint: params.baseMint.publicKey.toString(),
      config: params.config.toString(),
      name: params.name,
      nameBytes,
      symbol: params.symbol,
      symbolBytes,
      uriLength: uriBytes,
    })

    const createPoolParam = {
      baseMint: params.baseMint.publicKey,
      config: params.config,
      name: params.name,
      symbol: params.symbol,
      uri: params.uri,
      payer: params.payer,
      poolCreator: params.poolCreator,
    }

    console.log("[Meteora DBC] Calling DBC SDK createPool...")
    const poolTransaction = await this.client.pool.createPool(createPoolParam)

    const connection = this.client.program.provider.connection
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")

    poolTransaction.recentBlockhash = blockhash
    poolTransaction.feePayer = params.payer

    poolTransaction.partialSign(params.baseMint)

    console.log("[Meteora DBC] Transaction prepared, requesting wallet signature...")
    const signedTransaction = await signTransaction(poolTransaction)

    console.log("[Meteora DBC] Sending signed transaction to network...")
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    })

    console.log("[Meteora DBC] Transaction sent, signature:", signature)
    console.log("[Meteora DBC] Confirming transaction...")

    await connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      "confirmed",
    )

    console.log("[Meteora DBC] Transaction confirmed!")

    const [poolAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("virtual_pool"), params.config.toBuffer(), params.baseMint.publicKey.toBuffer()],
      METEORA_DBC_PROGRAM_ID,
    )

    const [bondingCurveAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("bonding_curve"), poolAddress.toBuffer()],
      METEORA_DBC_PROGRAM_ID,
    )

    console.log("[Meteora DBC] Pool created successfully!")
    console.log("[Meteora DBC] Pool address:", poolAddress.toString())
    console.log("[Meteora DBC] Bonding curve:", bondingCurveAddress.toString())
    console.log("[Meteora DBC] Mint:", params.baseMint.publicKey.toString())

    return {
      poolAddress: poolAddress.toString(),
      baseMint: params.baseMint.publicKey.toString(),
      bondingCurveAddress: bondingCurveAddress.toString(),
      transactionSignature: signature,
    }
  }

  async getPoolInfo(poolAddress: PublicKey) {
    return await this.client.pool.getVirtualPool(poolAddress)
  }

  async getConfig(configAddress: PublicKey) {
    return await this.client.pool.getConfig(configAddress)
  }
}
