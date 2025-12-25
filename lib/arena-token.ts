import { PublicKey, type Connection, Transaction } from "@solana/web3.js"
import { getAssociatedTokenAddress, createBurnInstruction } from "@solana/spl-token"

export const ARENA_TOKEN_MINT = new PublicKey("egimFKq4YU5N2r3B3BCZby5WVoFbbS1EhRLcnqwpump")
export const ARENA_DECIMALS = 6

export const PRIZE_DISTRIBUTION = {
  WINNER_PERCENTAGE: 50, // 50% to winner
  GIVEAWAY_PERCENTAGE: 25, // 25% for community giveaways
  BURN_PERCENTAGE: 25, // 25% burned for scarcity
}

export interface WagerTournament {
  id: string
  totalPot: number
  giveawayPool: number
  burnAmount: number
  participants: number
}

/**
 * Calculate prize distribution from total pot
 */
export function calculatePrizeDistribution(totalPot: number) {
  const winnerAmount = (totalPot * PRIZE_DISTRIBUTION.WINNER_PERCENTAGE) / 100
  const giveawayAmount = (totalPot * PRIZE_DISTRIBUTION.GIVEAWAY_PERCENTAGE) / 100
  const burnAmount = (totalPot * PRIZE_DISTRIBUTION.BURN_PERCENTAGE) / 100

  return {
    winnerAmount,
    giveawayAmount,
    burnAmount,
    total: winnerAmount + giveawayAmount + burnAmount,
  }
}

/**
 * Get player's ARENA token balance
 */
export async function getArenaBalance(connection: Connection, walletAddress: PublicKey): Promise<number> {
  try {
    console.log("[v0] Fetching ARENA balance for wallet:", walletAddress.toBase58())
    console.log("[v0] ARENA Token Mint:", ARENA_TOKEN_MINT.toBase58())

    const tokenAccount = await getAssociatedTokenAddress(ARENA_TOKEN_MINT, walletAddress)
    console.log("[v0] Token Account Address:", tokenAccount.toBase58())

    const accountInfo = await connection.getAccountInfo(tokenAccount)
    console.log("[v0] Token Account Info:", accountInfo ? "EXISTS" : "DOES NOT EXIST")

    if (!accountInfo) {
      // Token account doesn't exist yet (wallet has never received ARENA tokens)
      console.log("[v0] Token account not found - returning 0 balance")
      return 0
    }

    const balance = await connection.getTokenAccountBalance(tokenAccount)
    const parsedBalance = Number.parseFloat(balance.value.amount) / Math.pow(10, ARENA_DECIMALS)
    console.log("[v0] Raw balance:", balance.value.amount)
    console.log("[v0] Parsed balance:", parsedBalance)
    return parsedBalance
  } catch (error) {
    // Silently return 0 for any token account errors
    console.error("[v0] Error fetching ARENA balance:", error)
    return 0
  }
}

/**
 * Create transaction to burn ARENA tokens
 */
export async function createBurnTransaction(
  connection: Connection,
  walletAddress: PublicKey,
  amount: number,
): Promise<Transaction> {
  const tokenAccount = await getAssociatedTokenAddress(ARENA_TOKEN_MINT, walletAddress)

  const amountInSmallestUnit = Math.floor(amount * Math.pow(10, ARENA_DECIMALS))

  const transaction = new Transaction().add(
    createBurnInstruction(
      tokenAccount, // Token account
      ARENA_TOKEN_MINT, // Mint
      walletAddress, // Owner
      amountInSmallestUnit, // Amount
    ),
  )

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = walletAddress

  return transaction
}
