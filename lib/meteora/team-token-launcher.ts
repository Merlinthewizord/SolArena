import type { PublicKey, Transaction } from "@solana/web3.js"
import { FunLaunchClient } from "./fun-launch-client"
import { DBC_CONFIG_ADDRESS } from "../dbc-config"

export interface TeamTokenConfig {
  name: string
  symbol: string
  description: string
  imageUri: string
  creator: PublicKey
}

export interface TeamTokenLaunchResult {
  success: boolean
  mintAddress: string
  poolAddress: string
  bondingCurveAddress: string
  transactionSignature: string
  explorerUrl: string
}

/**
 * TeamTokenLauncher integrates the Meteora Invent fun-launch scaffold
 * for launching team tokens with DBC bonding curves ONLY
 */
export class TeamTokenLauncher {
  private funLaunchClient: FunLaunchClient
  private network: "mainnet-beta" | "devnet"
  private rpcUrl: string

  constructor(network: "mainnet-beta" | "devnet" = "mainnet-beta") {
    this.network = network

    const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL
    if (!customRpcUrl || !customRpcUrl.startsWith("http")) {
      throw new Error(
        "NEXT_PUBLIC_SOLANA_RPC_URL must be configured with a paid RPC provider (Helius, QuickNode, Alchemy). " +
          "Public RPC endpoints do not support DBC token creation.",
      )
    }

    this.rpcUrl = customRpcUrl
    console.log("[Team Token Launcher] Using RPC:", customRpcUrl.substring(0, 50) + "...")

    this.funLaunchClient = new FunLaunchClient({
      rpcUrl: this.rpcUrl,
      poolConfigKey: DBC_CONFIG_ADDRESS,
    })
    console.log("[Team Token Launcher] Fun Launch client initialized")
  }

  async launchToken(
    config: TeamTokenConfig,
    signTransaction: (tx: Transaction) => Promise<Transaction>,
  ): Promise<TeamTokenLaunchResult> {
    console.log("[Team Token Launcher] Starting DBC token launch:", config)

    const result = await this.funLaunchClient.launchToken(
      {
        name: config.name,
        symbol: config.symbol,
        description: config.description,
        image: config.imageUri,
      },
      config.creator,
      signTransaction,
    )

    return result
  }
}
