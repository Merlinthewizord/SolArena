import { type NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createTeamPool } from "@/lib/meteora/createTeamPool"
import { DBC_CONFIG_ADDRESS } from "@/lib/dbc-config"
import { z } from "zod"

const LaunchRequestSchema = z.object({
  walletSignature: z.string().optional(),
  walletAddress: z.string(), // Added wallet address for payment
})

export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const teamId = params.teamId
    console.log("[Team Launch API] Received launch request for team:", teamId)

    const body = await request.json()
    const validatedBody = LaunchRequestSchema.parse(body)

    const { data: team, error: fetchError } = await supabaseAdmin.from("teams").select("*").eq("id", teamId).single()

    if (fetchError || !team) {
      console.error("[Team Launch API] Team not found:", fetchError)
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    console.log("[Team Launch API] Team found:", team.name)

    if (team.status !== "draft" && team.status !== null) {
      console.log("[Team Launch API] Team already launched, status:", team.status)
      return NextResponse.json({ error: "Team has already been launched" }, { status: 400 })
    }

    const creatorWallet = team.creator_wallet
    if (!creatorWallet) {
      return NextResponse.json({ error: "Team has no creator wallet" }, { status: 400 })
    }

    console.log("[Team Launch API] Creator wallet:", creatorWallet)

    const rpcUrl =
      process.env.SOLANA_MAINNET_RPC_URL ||
      "https://mainnet.helius-rpc.com/?api-key=e45878a7-25fb-4b1a-9f3f-3ed1d643b319"
    const poolConfigKey = DBC_CONFIG_ADDRESS

    console.log("[Team Launch API] Using MAINNET RPC for teams:", rpcUrl)
    console.log("[Team Launch API] Pool config:", poolConfigKey.toBase58())

    const connection = new Connection(rpcUrl, "confirmed")

    try {
      console.log("[Team Launch API] Verifying pool config account...")
      const poolConfigAccount = await connection.getAccountInfo(poolConfigKey)

      if (!poolConfigAccount) {
        console.error("[Team Launch API] Pool config account does not exist:", poolConfigKey.toBase58())
        return NextResponse.json(
          {
            error: "DBC pool configuration not found on blockchain. The config address may be invalid.",
            configAddress: poolConfigKey.toBase58(),
          },
          { status: 500 },
        )
      }

      console.log("[Team Launch API] Pool config account verified, owner:", poolConfigAccount.owner.toBase58())
      console.log("[Team Launch API] Pool config data length:", poolConfigAccount.data.length)
    } catch (configError: any) {
      console.error("[Team Launch API] Pool config validation error:", configError)
      return NextResponse.json(
        {
          error: `Failed to validate pool configuration: ${configError.message}`,
          configAddress: poolConfigKey.toBase58(),
        },
        { status: 500 },
      )
    }

    const userWallet = new PublicKey(validatedBody.walletAddress)

    let logoUrl = team.logo_url
    if (team.logo_url && team.logo_url.startsWith("data:")) {
      console.log("[Team Launch API] Uploading base64 logo to Supabase Storage...")
      try {
        const base64Match = team.logo_url.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,(.+)$/)
        if (!base64Match) {
          console.error("[Team Launch API] Invalid data URL format")
          logoUrl = "https://arweave.net/placeholder-team-logo.png"
        } else {
          const imageType = base64Match[1]
          const base64Data = base64Match[2]
          const buffer = Buffer.from(base64Data, "base64")

          const fileName = `team-logos/${teamId}-${Date.now()}.${imageType}`

          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("team-assets")
            .upload(fileName, buffer, {
              contentType: `image/${imageType}`,
              upsert: true,
              cacheControl: "3600",
            })

          if (uploadError) {
            console.error("[Team Launch API] Logo upload error:", uploadError.message)
            logoUrl = "https://arweave.net/placeholder-team-logo.png"
          } else {
            const { data: publicUrlData } = supabaseAdmin.storage.from("team-assets").getPublicUrl(fileName)
            logoUrl = publicUrlData.publicUrl
            console.log("[Team Launch API] Logo uploaded successfully:", logoUrl)
          }
        }
      } catch (uploadErr: any) {
        console.error("[Team Launch API] Logo upload exception:", uploadErr.message)
        logoUrl = "https://arweave.net/placeholder-team-logo.png"
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : request.headers.get("origin") || "https://sol-arena.vercel.app"

    const metadataUri = `${baseUrl}/teams/${teamId}`

    console.log("[Team Launch API] Using team page as metadata URI:", metadataUri)

    const metadata = {
      name: team.name,
      symbol: team.symbol,
      description: team.description || "",
      image: logoUrl || "https://arweave.net/placeholder-team-logo.png",
      external_url: metadataUri,
      attributes: [
        { trait_type: "Game", value: team.game || "Multi-Game" },
        { trait_type: "Region", value: team.region || "Global" },
        { trait_type: "Team ID", value: teamId },
      ],
    }

    const metadataFileName = `team-metadata/${teamId}.json`
    const { error: metadataError } = await supabaseAdmin.storage
      .from("team-assets")
      .upload(metadataFileName, JSON.stringify(metadata, null, 2), {
        contentType: "application/json",
        upsert: true,
      })

    if (metadataError) {
      console.warn("[Team Launch API] Metadata JSON upload warning:", metadataError)
      // Don't fail if JSON backup upload fails
    }

    console.log("[Team Launch API] Creating DBC pool with team page as metadata...")

    const poolResult = await createTeamPool({
      connection,
      poolConfigKey,
      name: team.name,
      symbol: team.symbol,
      metadataUri,
      teamId,
      userWallet, // User wallet pays instead of server
    })

    console.log("[Team Launch API] Pool transaction prepared")

    return NextResponse.json({
      success: true,
      teamId,
      serializedTransaction: poolResult.serializedTransaction,
      mintAddress: poolResult.mintAddress,
      poolAddress: poolResult.poolAddress,
      bondingCurveAddress: poolResult.bondingCurveAddress,
      metadataUri,
      blockhash: poolResult.blockhash,
      lastValidBlockHeight: poolResult.lastValidBlockHeight,
    })
  } catch (error: any) {
    console.error("[Team Launch API] Error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to prepare team token launch",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const teamId = params.teamId
    const body = await request.json()

    const { txSignature, mintAddress, poolAddress, bondingCurveAddress, metadataUri, logoUrl } = body

    console.log("[Team Launch API] Confirming launch with signature:", txSignature)

    const rpcUrl =
      process.env.SOLANA_MAINNET_RPC_URL ||
      "https://mainnet.helius-rpc.com/?api-key=e45878a7-25fb-4b1a-9f3f-3ed1d643b319"
    const connection = new Connection(rpcUrl, "confirmed")

    console.log("[Team Launch API] Verifying pool exists on-chain...")
    const poolPubkey = new PublicKey(poolAddress)
    const poolAccount = await connection.getAccountInfo(poolPubkey)

    if (!poolAccount) {
      console.error("[Team Launch API] Pool account does not exist on-chain:", poolAddress)
      return NextResponse.json(
        {
          error: "Pool verification failed. The pool account was not found on-chain.",
          poolAddress,
        },
        { status: 400 },
      )
    }

    console.log("[Team Launch API] Pool verified on-chain, updating database...")

    const { data: updatedTeam, error: updateError } = await supabaseAdmin
      .from("teams")
      .update({
        team_mint: mintAddress,
        pool_address: poolAddress,
        bonding_curve_address: bondingCurveAddress,
        metadata_uri: metadataUri,
        status: "live",
        launch_tx: txSignature,
        logo_url: logoUrl,
      })
      .eq("id", teamId)
      .select()
      .single()

    if (updateError) {
      console.error("[Team Launch API] Database update error:", updateError)
      return NextResponse.json({ error: "Failed to update team record" }, { status: 500 })
    }

    console.log("[Team Launch API] Team successfully launched and verified")
    return NextResponse.json({ success: true, team: updatedTeam })
  } catch (error: any) {
    console.error("[Team Launch API] Confirmation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
