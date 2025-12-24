import { type NextRequest, NextResponse } from "next/server"

const CHALLONGE_API_KEY = "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"
const CHALLONGE_API_URL = "https://api.challonge.com/v1"

export async function GET() {
  try {
    const response = await fetch(`${CHALLONGE_API_URL}/tournaments.json?api_key=${CHALLONGE_API_KEY}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Challonge API error:", errorText)
      return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching tournaments:", error)
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, game, entryFee } = body

    console.log("[v0] Creating tournament:", { name, game, entryFee })

    const response = await fetch(`${CHALLONGE_API_URL}/tournaments.json`, {
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
          description: `Entry Fee: ${entryFee} SOL`,
          open_signup: true,
          hold_third_place_match: false,
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Challonge API error:", errorText)
      return NextResponse.json({ error: "Failed to create tournament" }, { status: response.status })
    }

    const data = await response.json()
    console.log("[v0] Tournament created successfully:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating tournament:", error)
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 })
  }
}
