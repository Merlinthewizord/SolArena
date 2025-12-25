import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { getTeamStakePoolAddress } from "@/lib/streamflow/team-staking"

/**
 * GET /api/teams/[teamId]/stake-pool
 * Get stake pool information for a team token
 */
export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const supabase = await createServerClient()

    // Get team data
    const { data: team, error: teamError } = await supabase.from("teams").select("*").eq("id", params.teamId).single()

    if (teamError || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    if (!team.team_mint) {
      return NextResponse.json({ error: "Team token not launched" }, { status: 400 })
    }

    // Get or derive stake pool address
    if (!team.stake_pool_address) {
      // Derive the stake pool address (assuming it was created with nonce 0)
      const stakePoolAddress = getTeamStakePoolAddress(
        team.team_mint,
        team.created_by, // authority
        0, // nonce
      )

      return NextResponse.json({
        stakePoolAddress: stakePoolAddress.toString(),
        isCreated: false,
        teamMint: team.team_mint,
      })
    }

    return NextResponse.json({
      stakePoolAddress: team.stake_pool_address,
      isCreated: true,
      teamMint: team.team_mint,
      totalStaked: team.total_staked || 0,
    })
  } catch (error: any) {
    console.error("[Stake Pool API] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to get stake pool" }, { status: 500 })
  }
}
