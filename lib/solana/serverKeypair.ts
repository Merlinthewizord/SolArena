import bs58 from "bs58"
import { Keypair } from "@solana/web3.js"

export function getServerKeypair(): Keypair {
  const secretKeyB58 = process.env.SERVER_KEYPAIR_B58

  if (!secretKeyB58) {
    throw new Error("SERVER_KEYPAIR_B58 environment variable is not set")
  }

  try {
    const secretKeyBytes = bs58.decode(secretKeyB58)

    if (secretKeyBytes.length !== 64) {
      throw new Error(`Invalid keypair length: ${secretKeyBytes.length} bytes (expected 64)`)
    }

    const keypair = Keypair.fromSecretKey(secretKeyBytes)
    console.log("[Server Keypair] Loaded successfully:", keypair.publicKey.toBase58())

    return keypair
  } catch (error: any) {
    throw new Error(`Failed to load server keypair: ${error.message}`)
  }
}
