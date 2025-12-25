import { PublicKey } from "@solana/web3.js"
import BN from "bn.js"
import { getStakePoolPda, getStakeEntryPda, STAKING_PROGRAM_ID } from "./staking-client"

/**
 * Get the stake pool address for a team token
 */
export function getTeamStakePoolAddress(teamMint: string, authority: string, nonce = 0): PublicKey {
  const programId = new PublicKey(STAKING_PROGRAM_ID.mainnet)
  const mint = new PublicKey(teamMint)
  const auth = new PublicKey(authority)

  return getStakePoolPda(programId, mint, auth, nonce)
}

/**
 * Get the stake entry address for a user's stake
 */
export function getUserStakeEntryAddress(stakePoolAddress: string, userWallet: string, nonce = 0): PublicKey {
  const programId = new PublicKey(STAKING_PROGRAM_ID.mainnet)
  const stakePool = new PublicKey(stakePoolAddress)
  const owner = new PublicKey(userWallet)

  return getStakeEntryPda(programId, stakePool, owner, nonce)
}

/**
 * Convert token amount with decimals to raw amount
 */
export function toRawAmount(amount: number, decimals: number): BN {
  return new BN(Math.floor(amount * Math.pow(10, decimals)))
}

/**
 * Convert raw amount to token amount with decimals
 */
export function fromRawAmount(rawAmount: BN, decimals: number): number {
  return rawAmount.toNumber() / Math.pow(10, decimals)
}

/**
 * Calculate stake weight based on duration
 * Weight increases linearly from 1x to maxWeight
 */
export function calculateStakeWeight(
  duration: number,
  minDuration: number,
  maxDuration: number,
  maxWeight: number,
): number {
  if (duration <= minDuration) return 1
  if (duration >= maxDuration) return maxWeight

  const durationRange = maxDuration - minDuration
  const durationProgress = duration - minDuration
  const weightRange = maxWeight - 1

  return 1 + (weightRange * durationProgress) / durationRange
}
