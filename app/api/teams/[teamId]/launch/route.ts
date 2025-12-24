import { type NextRequest, NextResponse } from "next/server"
import { Connection, PublicKey } from "@solana/web3.js"
import { supabaseAdmin, recordAuditLog } from "@/lib/supabase/admin"
import { getServerKeypair } from "@/lib/solana/serverKeypair"
import { createTeamPool } from "@/lib/meteora/createTeamPool"
import { z } from "zod"

const LaunchRequestSchema = z.object({
  walletSignature: z.string().optional(),
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

    const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
    const poolConfigKeyStr = process.env.POOL_CONFIG_KEY || process.env.NEXT_PUBLIC_DBC_CONFIG_ADDRESS

    if (!poolConfigKeyStr) {
      return NextResponse.json({ error: "Pool config key not configured" }, { status: 500 })
    }

    console.log("[Team Launch API] Using RPC:", rpcUrl)
    console.log("[Team Launch API] Pool config:", poolConfigKeyStr)

    const connection = new Connection(rpcUrl, "confirmed")
    const serverKeypair = getServerKeypair()
    const poolConfigKey = new PublicKey(poolConfigKeyStr)

    let logoUrl = team.logo_url
    if (team.logo_url && team.logo_url.startsWith("data:")) {
      console.log("[Team Launch API] Uploading logo to Supabase Storage...")
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
            console.error("[Team Launch API] Logo upload error:", uploadError)
            logoUrl = "https://arweave.net/placeholder-team-logo.png"
          } else {
            const { data: publicUrlData } = supabaseAdmin.storage.from("team-assets").getPublicUrl(fileName)
            logoUrl = publicUrlData.publicUrl
            console.log("[Team Launch API] Logo uploaded:", logoUrl)
          }
        }
      } catch (uploadErr) {
        console.error("[Team Launch API] Logo upload exception:", uploadErr)
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
      serverKeypair,
      poolConfigKey,
      name: team.name,
      symbol: team.symbol,
      metadataUri,
      teamId,
    })

    console.log("[Team Launch API] Pool created:", poolResult)

    const { data: updatedTeam, error: updateError } = await supabaseAdmin
      .from("teams")
      .update({
        team_mint: poolResult.mintAddress,
        pool_address: poolResult.poolAddress,
        bonding_curve_address: poolResult.bondingCurveAddress,
        metadata_uri: metadataUri,
        dbc_config_address: poolConfigKeyStr,
        status: "live",
        launch_tx: poolResult.txSignature,
        logo_url: logoUrl,
      })
      .eq("id", teamId)
      .select()
      .single()

    if (updateError) {
      console.error("[Team Launch API] Database update error:", updateError)
      return NextResponse.json({ error: "Failed to update team record" }, { status: 500 })
    }

    await recordAuditLog({
      action: "team_token_launched",
      actorWallet: creatorWallet,
      targetType: "team",
      targetId: teamId,
      payload: {
        mintAddress: poolResult.mintAddress,
        bondingCurveAddress: poolResult.bondingCurveAddress,
        txSignature: poolResult.txSignature,
      },
    })

    console.log("[Team Launch API] ✓ Launch completed successfully!")

    return NextResponse.json({
      success: true,
      teamId,
      teamMint: poolResult.mintAddress,
      poolAddress: poolResult.poolAddress,
      bondingCurveAddress: poolResult.bondingCurveAddress,
      metadataUri,
      txSignature: poolResult.txSignature,
    })
  } catch (error: any) {
    console.error("[Team Launch API] Error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to launch team token",
        details: error.toString(),
      },
      { status: 500 },
    )
  }
}
