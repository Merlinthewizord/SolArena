import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

// GET - Fetch all ARENA wager tournaments
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    const { data: tournaments, error } = await supabase
      .from("arena_wager_tournaments")
      .select(
        `
        *,
        participants:arena_wager_participants(count)
      `,
      )
      .order("start_time", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      tournaments: tournaments || [],
    })
  } catch (error) {
    console.error("[Arena Wager API] Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}

// POST - Create new ARENA wager tournament
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      name,
      game,
      entryWager,
      maxParticipants,
      startTime,
      escrowWallet,
      creatorWallet,
      matchFormat = "best_of_7",
    } = body

    if (!name || !game || !entryWager || !escrowWallet || !creatorWallet || !startTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: tournament, error } = await supabase
      .from("arena_wager_tournaments")
      .insert({
        name,
        game,
        entry_wager: entryWager,
        max_participants: maxParticipants || 100,
        escrow_wallet: escrowWallet,
        created_by_wallet: creatorWallet,
        start_time: startTime,
        match_format: matchFormat,
        status: "registration",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error("[Arena Wager API] Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}
