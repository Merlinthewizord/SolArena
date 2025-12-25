"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Plus, Wallet, Shield, Coins, X } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { VideoBackground } from "@/components/video-background"
import { useToast } from "@/hooks/use-toast"

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
  bonding_curve_address: string
  status: string
}

export default function TeamsPage() {
  const { connected, profile, connect } = useWallet()
  const { toast } = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")
  const supabase = useMemo(() => createBrowserClient(), [])

  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    description: "",
    logo_url: "",
    game: "",
    region: "",
  })

  useEffect(() => {
    fetchTeams()
  }, [supabase])

  const fetchTeams = async () => {
    if (!supabase) {
      console.error("[v0] Supabase client is not configured; skipping team fetch.")
      toast({
        title: "Service unavailable",
        description: "Unable to load teams because Supabase is not configured.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.from("teams").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching teams:", error)
      } else {
        setTeams(data || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching teams:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      toast({
        title: "Service unavailable",
        description: "Supabase is not configured. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (!connected || !profile) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a team",
        variant: "destructive",
      })
      return
    }

    if (formData.name.length > 32) {
      toast({
        title: "Team name too long",
        description: "Team name must be 32 characters or less",
        variant: "destructive",
      })
      return
    }

    if (formData.symbol.length > 10) {
      toast({
        title: "Token symbol too long",
        description: "Token symbol must be 10 characters or less",
        variant: "destructive",
      })
      return
    }

    setCreating(true)

    try {
      const { data: existingTeam, error: checkError } = await supabase
        .from("teams")
        .select("name")
        .eq("name", formData.name)
        .single()

      if (existingTeam) {
        toast({
          title: "Team name already exists",
          description: "Please choose a different team name",
          variant: "destructive",
        })
        setCreating(false)
        return
      }

      const { data: existingSymbol } = await supabase
        .from("teams")
        .select("symbol")
        .eq("symbol", formData.symbol)
        .single()

      if (existingSymbol) {
        toast({
          title: "Token symbol already exists",
          description: "Please choose a different token symbol",
          variant: "destructive",
        })
        setCreating(false)
        return
      }

      const logoToSave = logoPreview || formData.logo_url || "/abstract-team-logo.png"

      const { data: newTeam, error } = await supabase
        .from("teams")
        .insert({
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          logo_url: logoToSave,
          creator_wallet: profile.wallet_address,
          game: formData.game,
          region: formData.region,
          status: "draft",
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      toast({
        title: "Team created!",
        description: `${formData.name} created as draft. You can launch the token from the team page.`,
      })

      setShowCreateForm(false)
      setLogoFile(null)
      setLogoPreview("")
      setFormData({
        name: "",
        symbol: "",
        description: "",
        logo_url: "",
        game: "",
        region: "",
      })
      fetchTeams()
    } catch (error: any) {
      console.error("[v0] Error creating team:", error)

      let errorMessage = "Failed to create team. Please try again."

      if (error.message?.includes("duplicate key")) {
        errorMessage = "A team with this name or symbol already exists. Please choose different values."
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error creating team",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen">
      <VideoBackground />

      <Navigation />

      <div className="container mx-auto px-4 lg:px-8 py-24 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold">Team Tokens</h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Create team tokens, stake to support your favorites, and earn rewards when they win tournaments
            </p>
          </div>
          {connected && (
            <Button size="lg" onClick={() => setShowCreateForm(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Create Team
            </Button>
          )}
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 space-y-3 bg-card/50 backdrop-blur border-2 border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Create Team Token</h3>
            <p className="text-muted-foreground">
              Launch your team with a unique SPL token on Solana. Set name, symbol, and branding.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-card/50 backdrop-blur border-2 border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <Coins className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Stake & Support</h3>
            <p className="text-muted-foreground">
              Buy and stake team tokens to support your favorite teams and become eligible for rewards.
            </p>
          </Card>

          <Card className="p-6 space-y-3 bg-card/50 backdrop-blur border-2 border-border">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Earn Rewards</h3>
            <p className="text-muted-foreground">
              When your team wins tournaments, stakers earn a share of the prize pool automatically.
            </p>
          </Card>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <Card className="p-8 mb-12 border-2 border-primary/20 bg-card/50 backdrop-blur">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Create New Team</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Solana Dragons"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    maxLength={32}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{formData.name.length}/32 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbol">Token Symbol *</Label>
                  <Input
                    id="symbol"
                    placeholder="e.g., DRAG"
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-muted-foreground">{formData.symbol.length}/10 characters</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your team..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="game">Primary Game</Label>
                  <Input
                    id="game"
                    placeholder="e.g., Fortnite, Valorant"
                    value={formData.game}
                    onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    placeholder="e.g., NA, EU, APAC"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Team Logo</Label>
                <div className="flex items-start gap-4">
                  {logoPreview && (
                    <img
                      src={logoPreview || "/placeholder.svg"}
                      alt="Logo preview"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-border"
                    />
                  )}
                  <div className="flex-1">
                    <div className="relative">
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a logo image (PNG, JPG, or GIF). Recommended size: 512x512px
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? "Creating..." : "Create Team"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Teams Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-6">All Teams</h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading teams...</div>
          ) : teams.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`}>
                  <Card className="p-6 space-y-4 bg-card/50 backdrop-blur border-2 border-border hover:border-primary/50 transition-all hover:scale-105 cursor-pointer h-full">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={team.logo_url || "/placeholder.svg"}
                          alt={team.name}
                          className="w-12 h-12 rounded-xl object-cover bg-muted"
                        />
                        <div>
                          <h3 className="text-xl font-bold">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">${team.symbol}</p>
                        </div>
                      </div>
                      {team.is_verified && (
                        <Badge variant="secondary" className="gap-1">
                          <Shield className="w-3 h-3" />
                          Verified
                        </Badge>
                      )}
                    </div>

                    {team.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                    )}

                    <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
                      <div>
                        <div className="text-xs text-muted-foreground">Record</div>
                        <div className="text-sm font-semibold">
                          {team.total_wins}W-{team.total_losses}L
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Earnings</div>
                        <div className="text-sm font-semibold text-primary">{team.total_earnings} SOL</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Staked</div>
                        <div className="text-sm font-semibold">{team.total_staked || 0}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {team.game && (
                        <Badge variant="outline" className="text-xs">
                          {team.game}
                        </Badge>
                      )}
                      {team.region && (
                        <Badge variant="outline" className="text-xs">
                          {team.region}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center bg-card/50 backdrop-blur">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">No teams yet</h3>
              <p className="text-muted-foreground mb-6">Be the first to create a team and start earning rewards!</p>
              {connected ? (
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Team
                </Button>
              ) : (
                <Button onClick={connect}>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
