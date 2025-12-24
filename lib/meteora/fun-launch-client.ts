import { Connection, Keypair, type PublicKey, type Transaction } from "@solana/web3.js"
import { MeteoraDBCService } from "./dbc-client"

export interface FunLaunchConfig {
  rpcUrl: string
  poolConfigKey: PublicKey
}

export interface TokenMetadata {
  name: string
  symbol: string
  description: string
  image: string
}

export interface LaunchResult {
  success: boolean
  mintAddress: string
  poolAddress: string
  bondingCurveAddress: string
  transactionSignature: string
  explorerUrl: string
}

/**
 * FunLaunchClient implements the Meteora Invent fun-launch scaffold pattern
 * for launching tokens with DBC bonding curves
 */
export class FunLaunchClient {
  private connection: Connection
  private dbcService: MeteoraDBCService
  private poolConfigKey: PublicKey

  constructor(config: FunLaunchConfig) {
    console.log("[Fun Launch] Initializing with RPC:", config.rpcUrl)

    this.connection = new Connection(config.rpcUrl, "confirmed")
    // Use MeteoraDBCService instead of DynamicBondingCurveClient
    this.dbcService = new MeteoraDBCService(this.connection, "confirmed")
    this.poolConfigKey = config.poolConfigKey
  }

  /**
   * Launch a new token with DBC bonding curve
   * This follows the Meteora Invent fun-launch scaffold pattern
   */
  async launchToken(
    metadata: TokenMetadata,
    creator: PublicKey,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
  ): Promise<LaunchResult> {
    console.log("[Fun Launch] ====== STARTING TOKEN LAUNCH ======")
    console.log("[Fun Launch] Token name:", metadata.name)
    console.log("[Fun Launch] Token symbol:", metadata.symbol)
    console.log("[Fun Launch] Creator:", creator.toBase58())

    const nameBytes = Buffer.byteLength(metadata.name, "utf8")
    const symbolBytes = Buffer.byteLength(metadata.symbol, "utf8")
    const uriBytes = Buffer.byteLength(metadata.image, "utf8")

    console.log("[Fun Launch] Metadata validation:", {
      nameBytes,
      nameMax: 32,
      symbolBytes,
      symbolMax: 10,
      uriBytes,
      uriMax: 200,
    })

    if (nameBytes > 32) {
      throw new Error(`Token name too long: ${nameBytes} bytes (max 32). Current: "${metadata.name}"`)
    }

    if (symbolBytes > 10) {
      throw new Error(`Token symbol too long: ${symbolBytes} bytes (max 10). Current: "${metadata.symbol}"`)
    }

    if (uriBytes > 200) {
      throw new Error(`Token URI too long: ${uriBytes} bytes (max 200). Use a hosted URL instead of data URI.`)
    }

    console.log("[Fun Launch] ✓ Metadata validation passed")

    try {
      console.log("[Fun Launch] Verifying pool config at:", this.poolConfigKey.toBase58())
      const poolConfig = await this.connection.getAccountInfo(this.poolConfigKey)
      if (!poolConfig) {
        throw new Error(
          `DBC pool config not found at ${this.poolConfigKey.toBase58()}. ` +
            `Ensure you're connected to mainnet-beta where the config exists.`,
        )
      }

      console.log("[Fun Launch] ✓ Pool config verified")

      const baseMint = Keypair.generate()
      console.log("[Fun Launch] Generated mint keypair:", baseMint.publicKey.toBase58())

      console.log("[Fun Launch] Calling MeteoraDBCService.createPool()...")
      const result = await this.dbcService.createPool(
        {
          baseMint: baseMint,
          config: this.poolConfigKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.image,
          payer: creator,
          poolCreator: creator,
        },
        signTransaction,
      )

      console.log("[Fun Launch] ✓ Pool created successfully!")
      console.log("[Fun Launch] Mint:", result.baseMint)
      console.log("[Fun Launch] Pool:", result.poolAddress)
      console.log("[Fun Launch] Bonding Curve:", result.bondingCurveAddress)
      console.log("[Fun Launch] Transaction:", result.transactionSignature)

      const network = this.connection.rpcEndpoint.includes("devnet") ? "devnet" : "mainnet-beta"
      const explorerUrl = `https://solscan.io/tx/${result.transactionSignature}${network === "devnet" ? "?cluster=devnet" : ""}`

      return {
        success: true,
        mintAddress: result.baseMint.toBase58(),
        poolAddress: result.poolAddress.toBase58(),
        bondingCurveAddress: result.bondingCurveAddress.toBase58(),
        transactionSignature: result.transactionSignature,
        explorerUrl,
      }
    } catch (error: any) {
      console.error("[Fun Launch] ✗ Error launching token:", error.message || error)
      throw new Error(`Failed to launch token via DBC: ${error.message || error}`)
    }
  }

  /**
   * Get pool data for a token
   */
  async getPoolData(poolAddress: PublicKey) {
    try {
      const poolData = await this.dbcService.getPoolInfo(poolAddress)
      return poolData
    } catch (error) {
      console.error("[Fun Launch] Error fetching pool data:", error)
      return null
    }
  }
}
