import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: participants, error } = await supabase
      .from("tournament_participations")
      .select(`
        id,
        player_wallet:wallet_address,
        in_game_username,
        discord_handle,
        team_name,
        status
      `)
      .eq("tournament_uuid", id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching participants:", error)
      return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 })
    }

    return NextResponse.json({
      participants: participants || [],
      count: participants?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Error in participants API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
