import { type Connection, Keypair, type PublicKey, SystemProgram, Transaction } from "@solana/web3.js"
import {
  createInitializeMint2Instruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token"

export interface CreateTokenParams {
  teamName: string
  symbol: string
  description: string
  imageUri: string
  creatorWallet: PublicKey
  decimals?: number
  initialSupply?: number
}

export interface CreateTokenResult {
  mintAddress: string
  transactionSignature: string
  metadata?: {
    name: string
    symbol: string
    uri: string
  }
}

/**
 * Create a simple SPL token for the team
 * This creates a basic SPL token without bonding curve mechanics
 */
export async function createSimpleSPLToken(
  connection: Connection,
  params: CreateTokenParams,
  signTransaction: (tx: Transaction) => Promise<Transaction>,
): Promise<CreateTokenResult> {
  try {
    console.log("[v0] Creating SPL token for team:", params.teamName)

    const decimals = params.decimals || 6
    const initialSupply = params.initialSupply || 1_000_000

    // Generate new mint keypair
    const mintKeypair = Keypair.generate()
    console.log(`[v0] Generated mint address: ${mintKeypair.publicKey.toString()}`)

    try {
      // Get minimum lamports for rent exemption
      const lamports = await getMinimumBalanceForRentExemptMint(connection)

      // Create mint account
      const createAccountInstruction = SystemProgram.createAccount({
        fromPubkey: params.creatorWallet,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports,
        programId: TOKEN_PROGRAM_ID,
      })

      // Initialize mint
      const initializeMintInstruction = createInitializeMint2Instruction(
        mintKeypair.publicKey,
        decimals,
        params.creatorWallet, // mint authority
        params.creatorWallet, // freeze authority
        TOKEN_PROGRAM_ID,
      )

      // Get associated token account for creator
      const associatedTokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        params.creatorWallet,
        false,
        TOKEN_PROGRAM_ID,
      )

      // Create associated token account
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        params.creatorWallet, // payer
        associatedTokenAccount, // ata
        params.creatorWallet, // owner
        mintKeypair.publicKey, // mint
        TOKEN_PROGRAM_ID,
      )

      // Mint initial supply to creator
      const mintToInstruction = createMintToInstruction(
        mintKeypair.publicKey,
        associatedTokenAccount,
        params.creatorWallet,
        initialSupply * Math.pow(10, decimals),
        [],
        TOKEN_PROGRAM_ID,
      )

      // Build transaction
      const transaction = new Transaction().add(
        createAccountInstruction,
        initializeMintInstruction,
        createATAInstruction,
        mintToInstruction,
      )

      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized")
      transaction.recentBlockhash = blockhash
      transaction.feePayer = params.creatorWallet

      // Partial sign with mint keypair
      transaction.partialSign(mintKeypair)

      console.log("[v0] Requesting wallet signature...")
      // Sign with user's wallet
      const signedTransaction = await signTransaction(transaction)

      console.log("[v0] Sending transaction...")
      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      })

      console.log("[v0] Confirming transaction...")
      // Confirm transaction
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      )

      console.log(`[v0] Token created successfully! Mint: ${mintKeypair.publicKey.toString()}`)
      console.log(`[v0] Transaction: ${signature}`)

      return {
        mintAddress: mintKeypair.publicKey.toString(),
        transactionSignature: signature,
        metadata: {
          name: params.teamName,
          symbol: params.symbol,
          uri: params.imageUri,
        },
      }
    } catch (rpcError: any) {
      if (rpcError?.message?.includes("403") || rpcError?.message?.includes("Access forbidden")) {
        throw new Error(
          "Your RPC endpoint blocked this request (403 Forbidden). " +
            "The public Solana RPC does not allow token creation. " +
            "Please add NEXT_PUBLIC_SOLANA_RPC_URL to your environment variables with a paid RPC provider:\n" +
            "- Helius: https://helius.dev\n" +
            "- QuickNode: https://quicknode.com\n" +
            "- Alchemy: https://alchemy.com\n" +
            "- Triton: https://rpcpool.com",
        )
      }
      throw rpcError
    }
  } catch (error) {
    console.error("[v0] Error creating SPL token:", error)
    throw error
  }
}
