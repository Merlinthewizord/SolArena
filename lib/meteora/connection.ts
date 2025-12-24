import { Connection, clusterApiUrl } from "@solana/web3.js"

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet"

export interface ConnectionConfig {
  network: SolanaNetwork
  rpcUrl?: string
  commitment?: "processed" | "confirmed" | "finalized"
}

export function createSolanaConnection(config?: Partial<ConnectionConfig>): Connection {
  const network = config?.network || (process.env.NEXT_PUBLIC_SOLANA_NETWORK as SolanaNetwork) || "mainnet-beta"
  const commitment = config?.commitment || "confirmed"

  let rpcUrl = config?.rpcUrl || process.env.NEXT_PUBLIC_SOLANA_RPC_URL

  // If no custom RPC URL is provided, use the public cluster API URL
  if (!rpcUrl) {
    rpcUrl = clusterApiUrl(network)
    if (network === "mainnet-beta") {
      console.warn(
        "[Solana] Using public mainnet RPC. For production, use a dedicated RPC provider (Helius, QuickNode, etc.)",
      )
    }
  }

  console.log(`[Solana] Connecting to ${network} via ${rpcUrl}`)

  return new Connection(rpcUrl, commitment)
}

export function getSolanaExplorerUrl(signature: string, network: SolanaNetwork = "mainnet-beta"): string {
  const cluster = network === "mainnet-beta" ? "" : `?cluster=${network}`
  return `https://solscan.io/tx/${signature}${cluster}`
}
