import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY || "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"
const CHALLONGE_API_URL = "https://api.challonge.com/v1"

export async function GET() {
  try {
    console.log("[v0] Fetching tournaments from database...")
    const supabase = await createClient()

    // Fetch from our database
    const { data: dbTournaments, error: dbError } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("[v0] Database error fetching tournaments:", dbError)
      return NextResponse.json({ error: "Database error", tournaments: [] }, { status: 500 })
    }

    console.log("[v0] Found", dbTournaments?.length || 0, "tournaments in database")

    // Fetch from Challonge for live participant counts
    let challongeData: any[] = []
    try {
      const challongeResponse = await fetch(
        `${CHALLONGE_API_URL}/tournaments.json?api_key=${CHALLONGE_API_KEY}&_t=${Date.now()}`,
        {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      )

      if (challongeResponse.ok) {
        challongeData = await challongeResponse.json()
        console.log("[v0] Fetched", challongeData.length, "tournaments from Challonge")
      }
    } catch (challongeError) {
      console.error("[v0] Challonge API error (non-critical):", challongeError)
    }

    const tournaments = challongeData.map((challongeItem: any) => {
      const ct = challongeItem.tournament
      const dbTournament = (dbTournaments || []).find((dbt) => dbt.challonge_id === ct.id.toString())

      const entryFee = dbTournament?.entry_fee_sol || 0.1
      const participantCount = ct.participants_count || 0
      const prizePool = entryFee * participantCount

      return {
        id: dbTournament?.id || ct.id.toString(),
        name: ct.name,
        game: ct.game_name || dbTournament?.game || "Unknown",
        entryFee: Number.parseFloat(entryFee.toString()),
        prizePool: Number.parseFloat(prizePool.toFixed(2)),
        maxParticipants: dbTournament?.max_participants || 32,
        currentParticipants: participantCount,
        status: dbTournament?.status || ct.state,
        created_at: dbTournament?.created_at || ct.created_at,
        startDate: dbTournament?.start_time || dbTournament?.created_at || ct.created_at,
        challonge: {
          id: ct.id.toString(),
          url: ct.full_challonge_url,
          state: ct.state,
        },
      }
    })

    console.log("[v0] Returning", tournaments.length, "formatted tournaments")
    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error("[v0] Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments", tournaments: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      game,
      entryFee,
      entry_fee,
      maxParticipants,
      max_participants,
      walletAddress,
      wallet_address,
      onChainTxSignature,
    } = body

    const entryFeeSol = entryFee || entry_fee || 0.1
    const maxParts = maxParticipants || max_participants || 32
    const wallet = walletAddress || wallet_address

    if (!wallet) {
      console.error("[v0] Missing wallet address in request")
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    if (!name || !game) {
      console.error("[v0] Missing required fields:", { name, game })
      return NextResponse.json({ error: "Name and game are required" }, { status: 400 })
    }

    console.log("[v0] Creating tournament:", { name, game, entryFeeSol, maxParts, wallet })

    // Create on Challonge first
    const challongeResponse = await fetch(`${CHALLONGE_API_URL}/tournaments.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: CHALLONGE_API_KEY,
        tournament: {
          name: name,
          game_name: game,
          tournament_type: "single elimination",
          description: `Entry Fee: ${entryFeeSol} SOL`,
          open_signup: true,
          hold_third_place_match: false,
        },
      }),
    })

    if (!challongeResponse.ok) {
      const errorText = await challongeResponse.text()
      console.error("[v0] Challonge API error:", errorText)
      return NextResponse.json(
        { error: "Failed to create tournament on Challonge" },
        { status: challongeResponse.status },
      )
    }

    const challongeData = await challongeResponse.json()
    const challongeId = challongeData.tournament.id.toString()
    console.log("[v0] Challonge tournament created with ID:", challongeId)

    // Save to database
    const supabase = await createClient()
    const { data: tournament, error: dbError } = await supabase
      .from("tournaments")
      .insert({
        challonge_id: challongeId,
        name,
        game,
        entry_fee_sol: entryFeeSol,
        max_participants: maxParts,
        status: "open",
        created_by_wallet: wallet,
        onchain_tx_signature: onChainTxSignature || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return NextResponse.json(
        { error: "Tournament created on Challonge but failed to save to database" },
        { status: 500 },
      )
    }

    console.log("[v0] Tournament created successfully:", tournament.id)

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        challonge_id: tournament.challonge_id,
        name: tournament.name,
        game: tournament.game,
        entryFee: Number.parseFloat(tournament.entry_fee_sol),
        status: tournament.status,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}
