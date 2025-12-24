import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY || "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"
const CHALLONGE_API_URL = "https://api.challonge.com/v1"

export async function GET() {
  try {
    const supabase = await createClient()

    // Fetch from our database
    const { data: dbTournaments, error: dbError } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })

    if (dbError) {
      console.error("[v0] Database error fetching tournaments:", dbError)
    }

    // Fetch from Challonge for live data
    const challongeResponse = await fetch(
      `${CHALLONGE_API_URL}/tournaments.json?api_key=${CHALLONGE_API_KEY}&_t=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )

    let challongeData = []
    if (challongeResponse.ok) {
      challongeData = await challongeResponse.json()
    }

    // Merge DB and Challonge data
    const tournaments = (dbTournaments || []).map((dbTournament) => {
      const challongeTournament = challongeData.find(
        (ct: any) => ct.tournament.id.toString() === dbTournament.challonge_id,
      )

      const participantCount = challongeTournament?.tournament.participants_count || 0
      const prizePool = (dbTournament.entry_fee_sol * participantCount).toFixed(2)

      return {
        id: dbTournament.id,
        challongeId: dbTournament.challonge_id,
        name: dbTournament.name,
        game: dbTournament.game,
        entryFeeSol: Number.parseFloat(dbTournament.entry_fee_sol),
        status: dbTournament.status,
        startTime: dbTournament.start_time,
        participantCount,
        prizePoolSol: Number.parseFloat(prizePool),
        createdBy: dbTournament.created_by_wallet,
        escrowAddress: dbTournament.escrow_address,
      }
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error("[v0] Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments", tournaments: [] }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, game, entryFeeSol, maxParticipants, walletAddress } = body

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 401 })
    }

    console.log("[v0] Creating tournament:", { name, game, entryFeeSol })

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

    // Save to database
    const supabase = await createClient()
    const { data: tournament, error: dbError } = await supabase
      .from("tournaments")
      .insert({
        challonge_id: challongeId,
        name,
        game,
        entry_fee_sol: entryFeeSol,
        max_participants: maxParticipants,
        status: "open",
        created_by_wallet: walletAddress,
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

    // Log audit trail
    await supabase.from("admin_audit_log").insert({
      actor_wallet: walletAddress,
      action: "create_tournament",
      target_type: "tournament",
      target_id: tournament.id,
      payload: { name, game, entryFeeSol, challongeId },
    })

    console.log("[v0] Tournament created successfully:", tournament)

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        challongeId: tournament.challonge_id,
        name: tournament.name,
        game: tournament.game,
      },
    })
  } catch (error) {
    console.error("[v0] Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}
