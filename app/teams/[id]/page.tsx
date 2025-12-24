"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, ArrowLeft, Wallet, Coins, Target, Shield } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { VideoBackground } from "@/components/video-background"
import { useToast } from "@/hooks/use-toast"
import { Navigation } from "@/components/navigation"

interface Team {
  id: string
  name: string
  symbol: string
  description: string
  logo_url: string
  team_mint: string
  creator_wallet: string
  total_wins: number
  total_losses: number
  total_earnings: number
  total_staked: number
  game: string
  region: string
  is_verified: boolean
  created_at: string
}

interface TeamMember {
  id: string
  player_wallet: string
  role: string
  wins_with_team: number
  losses_with_team: number
  earnings_with_team: number
  joined_at: string
}

interface StakeInfo {
  amount: number
  rewards_claimed: number
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { connected, profile, connect } = useWallet()
  const { toast } = useToast()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [stakeAmount, setStakeAmount] = useState("")
  const [staking, setStaking] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (params.id) {
      fetchTeamData()
    }
  }, [params.id, profile])

  const fetchTeamData = async () => {
    try {
      // Fetch team details
      const { data: teamData, error: teamError } = await supabase.from("teams").select("*").eq("id", params.id).single()

      if (teamError) throw teamError

      setTeam(teamData)

      // Fetch team members
      const { data: membersData, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .eq("team_id", params.id)

      if (membersError) throw membersError

      setMembers(membersData || [])

      // Fetch stake info for current user
      if (profile?.wallet_address) {
        const { data: stakeData, error: stakeError } = await supabase
          .from("team_token_stakes")
          .select("*")
          .eq("team_id", params.id)
          .eq("staker_wallet", profile.wallet_address)
          .single()

        if (stakeData) {
          setStakeInfo({
            amount: Number(stakeData.amount),
            rewards_claimed: Number(stakeData.rewards_claimed),
          })
        }
      }
    } catch (error: any) {
      console.error("[v0] Error fetching team data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStake = async () => {
    if (!connected || !profile || !team) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to stake",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      })
      return
    }

    setStaking(true)

    try {
      // Check if user already has a stake
      if (stakeInfo) {
        // Update existing stake
        const { error } = await supabase
          .from("team_token_stakes")
          .update({
            amount: stakeInfo.amount + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("team_id", team.id)
          .eq("staker_wallet", profile.wallet_address)

        if (error) throw error
      } else {
        // Create new stake
        const { error } = await supabase.from("team_token_stakes").insert({
          team_id: team.id,
          staker_wallet: profile.wallet_address,
          amount: amount,
        })

        if (error) throw error
      }

      // Update team total staked
      const { error: teamError } = await supabase
        .from("teams")
        .update({
          total_staked: (team.total_staked || 0) + amount,
        })
        .eq("id", team.id)

      if (teamError) throw teamError

      toast({
        title: "Staked successfully!",
        description: `Staked ${amount} ${team.symbol} tokens`,
      })

      setStakeAmount("")
      fetchTeamData()
    } catch (error: any) {
      console.error("[v0] Error staking:", error)
      toast({
        title: "Error staking",
        description: error.message || "Failed to stake. Please try again.",
        variant: "destructive",
      })
    } finally {
      setStaking(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-muted-foreground">Loading team...</div>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-xl text-muted-foreground">Team not found</div>
          <Button onClick={() => router.push("/teams")}>Back to Teams</Button>
        </div>
      </div>
    )
  }

  const winRate =
    team.total_wins + team.total_losses > 0
      ? ((team.total_wins / (team.total_wins + team.total_losses)) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="min-h-screen">
      <VideoBackground />

      {/* Navigation */}
      <Navigation />

      <div className="container mx-auto px-4 lg:px-8 py-24 relative z-10">
        {/* Back button */}
        <div className="mb-6">
          <Button size="sm" variant="ghost" asChild>
            <Link href="/teams">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Teams
            </Link>
          </Button>
        </div>

        {/* Team Header */}
        <Card className="p-8 mb-8 bg-gradient-to-br from-card/80 to-secondary/30 backdrop-blur border-2 border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img
              src={team.logo_url || "/placeholder.svg"}
              alt={team.name}
              className="w-24 h-24 rounded-2xl object-cover bg-muted border-4 border-primary/20"
            />

            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-4xl font-bold">{team.name}</h1>
                <Badge variant="secondary" className="w-fit">
                  ${team.symbol}
                </Badge>
                {team.is_verified && (
                  <Badge variant="default" className="w-fit gap-1">
                    <Shield className="w-3 h-3" />
                    Verified
                  </Badge>
                )}
              </div>

              {team.description && <p className="text-muted-foreground text-lg">{team.description}</p>}

              <div className="flex flex-wrap gap-3">
                {team.game && (
                  <Badge variant="outline">
                    <Target className="w-3 h-3 mr-1" />
                    {team.game}
                  </Badge>
                )}
                {team.region && <Badge variant="outline">{team.region}</Badge>}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium">Total Earnings</span>
            </div>
            <div className="text-3xl font-bold text-primary">{team.total_earnings} SOL</div>
            <p className="text-xs text-muted-foreground">Prize winnings</p>
          </Card>

          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="w-5 h-5" />
              <span className="text-sm font-medium">Win Rate</span>
            </div>
            <div className="text-3xl font-bold">{winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {team.total_wins}W - {team.total_losses}L
            </p>
          </Card>

          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className="w-5 h-5" />
              <span className="text-sm font-medium">Total Staked</span>
            </div>
            <div className="text-3xl font-bold">{team.total_staked || 0}</div>
            <p className="text-xs text-muted-foreground">Token holders</p>
          </Card>

          <Card className="p-6 space-y-2 border-2 border-border hover:border-primary/50 transition-colors bg-card/50 backdrop-blur">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Team Members</span>
            </div>
            <div className="text-3xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">Active players</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Stake Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-2 border-border bg-card/50 backdrop-blur">
              <h2 className="text-2xl font-bold mb-6">Stake ${team.symbol}</h2>

              {stakeInfo && (
                <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Your Stake</div>
                      <div className="text-2xl font-bold">
                        {stakeInfo.amount} {team.symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Rewards Claimed</div>
                      <div className="text-2xl font-bold text-primary">{stakeInfo.rewards_claimed} SOL</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stake-amount">Amount to Stake</Label>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="0.0"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    step="0.1"
                    min="0"
                  />
                </div>

                <Button className="w-full" onClick={handleStake} disabled={!connected || staking}>
                  {!connected ? (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet to Stake
                    </>
                  ) : staking ? (
                    "Staking..."
                  ) : (
                    <>
                      <Coins className="w-4 h-4 mr-2" />
                      Stake {team.symbol}
                    </>
                  )}
                </Button>

                <div className="pt-4 space-y-2 text-sm text-muted-foreground">
                  <p>• Stake {team.symbol} tokens to support the team</p>
                  <p>• Earn rewards when the team wins tournaments</p>
                  <p>• Unstake anytime (rewards will be claimed automatically)</p>
                </div>
              </div>
            </Card>

            {/* Team Members */}
            <Card className="p-6 border-2 border-border bg-card/50 backdrop-blur">
              <h2 className="text-2xl font-bold mb-6">Team Roster</h2>

              {members.length > 0 ? (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{member.player_wallet.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">
                            {member.player_wallet.slice(0, 4)}...{member.player_wallet.slice(-4)}
                          </div>
                          <div className="text-sm text-muted-foreground capitalize">{member.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {member.wins_with_team}W-{member.losses_with_team}L
                        </div>
                        <div className="text-xs text-primary">{member.earnings_with_team} SOL</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No team members yet</p>
                </div>
              )}
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-2 border-border bg-card/50 backdrop-blur">
              <h3 className="text-lg font-bold mb-4">Team Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Token Mint</div>
                  <div className="font-mono text-xs break-all">{team.team_mint}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Creator</div>
                  <div className="font-mono text-xs">
                    {team.creator_wallet.slice(0, 6)}...{team.creator_wallet.slice(-6)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{new Date(team.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur">
              <h3 className="text-lg font-bold mb-4">How Rewards Work</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>1. Stake {team.symbol} tokens to become eligible for rewards</p>
                <p>2. When the team wins a tournament, the prize is distributed to all stakers</p>
                <p>3. Your share is proportional to your stake</p>
                <p>4. Claim rewards anytime from your dashboard</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
