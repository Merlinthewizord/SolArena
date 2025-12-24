import { type NextRequest, NextResponse } from "next/server"

const CHALLONGE_API_KEY = "4f3911421ecd87e06a5395d8c77c75e95526b36f9b8f256b"

export async function POST(request: NextRequest) {
  try {
    const { tournamentId } = await request.json()

    // Fetch final standings from Challonge
    const response = await fetch(`https://api.challonge.com/v1/tournaments/${tournamentId}/participants.json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: CHALLONGE_API_KEY,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch tournament standings")
    }

    const participants = await response.json()

    // Sort by final rank
    const sorted = participants.sort((a: any, b: any) => {
      return (a.participant.final_rank || 999) - (b.participant.final_rank || 999)
    })

    // Get top 3 wallet addresses (stored in participant names or IDs)
    const winners = {
      first: sorted[0]?.participant.name || null,
      second: sorted[1]?.participant.name || null,
      third: sorted[2]?.participant.name || null,
    }

    return NextResponse.json({ winners, participants: sorted })
  } catch (error) {
    console.error("Error finalizing tournament:", error)
    return NextResponse.json({ error: "Failed to finalize tournament" }, { status: 500 })
  }
}
