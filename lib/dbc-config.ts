import { PublicKey } from "@solana/web3.js"

/**
 * Meteora Dynamic Bonding Curve (DBC) Program ID
 * This is the main Meteora DBC program on Solana
 */
export const METEORA_DBC_PROGRAM_ID = process.env.NEXT_PUBLIC_METEORA_DBC_PROGRAM_ID
  ? new PublicKey(process.env.NEXT_PUBLIC_METEORA_DBC_PROGRAM_ID)
  : new PublicKey("dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN")

/**
 * Meteora Dynamic Bonding Curve (DBC) Configuration
 * This is a shared DBC config used for all team token launches
 */
export const DBC_CONFIG_ADDRESS = process.env.NEXT_PUBLIC_DBC_CONFIG_ADDRESS
  ? new PublicKey(process.env.NEXT_PUBLIC_DBC_CONFIG_ADDRESS)
  : new PublicKey("2HUtAHdaWPZfsq4byuQTCDCF7q7zTfVKX8iFrYL6EJJC")

/**
 * Default quote mint for team token pools (typically USDC or SOL)
 */
export const DEFAULT_QUOTE_MINT = new PublicKey("So11111111111111111111111111111111111111112") // Native SOL

/**
 * Team token configuration defaults
 */
export const TEAM_TOKEN_CONFIG = {
  decimals: 6,
  initialSupply: 1_000_000, // 1M tokens
  symbol_max_length: 10,
}
