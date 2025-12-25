"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Gamepad2, Link2, Trophy, Users, ArrowLeft } from "lucide-react"

interface TournamentDetail {
  id: string
  name: string
  game: string
  entryFee: number
  prizePool: number
  maxParticipants: number | null
  currentParticipants: number
  status: string
  startDate: string | null
  challonge?: {
    id: string
    url: string
    state: string
  } | null
}

interface Participant {
  id: string
  wallet_address: string
  in_game_username: string
  discord_handle: string | null
  team_name: string | null
  status: string
  registered_at: string
}

interface BracketMatch {
  home: string
  away: string
}

interface BracketRound {
  name: string
  matches: BracketMatch[]
}

const roundNameForSize = (size: number) => {
  if (size === 2) return "Final"
  if (size === 4) return "Semifinals"
  if (size === 8) return "Quarterfinals"
  if (size === 16) return "Round of 16"
  if (size === 32) return "Round of 32"
  return `Round of ${size}`
}

const buildBracket = (participants: Participant[]): BracketRound[] => {
  const participantNames = participants.map(
    (p) => p.in_game_username || p.team_name || `Player ${p.wallet_address.slice(0, 4)}`,
  )

  const bracketSize = Math.max(2, 2 ** Math.ceil(Math.log2(Math.max(participantNames.length, 2))))
  const seeds = [...participantNames]

  while (seeds.length < bracketSize) {
    seeds.push("Open Slot")
  }

  const rounds: BracketRound[] = []
  let currentMatches: BracketMatch[] = []

  for (let i = 0; i < seeds.length; i += 2) {
    currentMatches.push({ home: seeds[i], away: seeds[i + 1] })
  }

  rounds.push({
    name: roundNameForSize(seeds.length),
    matches: currentMatches,
  })

  while (currentMatches.length > 1) {
    const nextMatches: BracketMatch[] = []

    for (let i = 0; i < currentMatches.length; i += 2) {
      nextMatches.push({
        home: `Winner of ${rounds[rounds.length - 1].name} Match ${i + 1}`,
        away: `Winner of ${rounds[rounds.length - 1].name} Match ${i + 2}`,
      })
    }

    currentMatches = nextMatches
    rounds.push({
      name: roundNameForSize(currentMatches.length * 2),
      matches: currentMatches,
    })
  }

  return rounds
}

const formatDate = (value?: string | null) => {
  if (!value) return "Date TBA"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date TBA"
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function TournamentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = useMemo(() => {
    if (!params?.id) return null
    return Array.isArray(params.id) ? params.id[0] : params.id
  }, [params])

  const [tournament, setTournament] = useState<TournamentDetail | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tournamentId) return

    const loadTournament = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/tournaments/${tournamentId}`)

        if (!response.ok) {
          const data = await response.json()
          setError(data.error || "Unable to load event.")
          setLoading(false)
          return
        }

        const data = await response.json()
        setTournament(data.tournament)
        setParticipants(data.participants || [])
      } catch (err) {
        console.error("[v0] Failed to fetch tournament detail", err)
        setError("Something went wrong while loading this event.")
      } finally {
        setLoading(false)
      }
    }

    loadTournament()
  }, [tournamentId])

  const bracketRounds = useMemo(() => buildBracket(participants), [participants])

  if (!tournamentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid tournament ID.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 pb-16">
        <div className="pt-24 pb-6 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Badge variant="secondary" className="capitalize">
            {tournament?.status?.replace("_", " ") || "event"}
          </Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg text-muted-foreground">Loading event profile...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <p className="text-lg text-destructive">{error}</p>
            <Button asChild>
              <Link href="/tournaments">Return to tournaments</Link>
            </Button>
          </div>
        ) : tournament ? (
          <div className="space-y-10">
            <section className="relative overflow-hidden rounded-2xl border border-border shadow-lg">
              <div className="absolute inset-0">
                <Image src="/placeholder.jpg" alt="Tournament banner" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/10" />
              </div>

              <div className="relative px-6 sm:px-10 py-10 lg:py-16 grid lg:grid-cols-[2fr,1fr] gap-10 items-center">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {tournament.status.replace("_", " ")}
                    </Badge>
                    {tournament.challonge?.url && (
                      <a
                        href={tournament.challonge.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Link2 className="w-4 h-4" />
                        View on Challonge
                      </a>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold leading-tight">{tournament.name}</h1>
                  <p className="text-lg text-muted-foreground flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5" />
                    {tournament.game}
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4 pt-4">
                    <Card className="bg-background/80 border-primary/20 shadow-sm">
                      <CardContent className="pt-6 space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Start Date
                        </p>
                        <p className="text-xl font-semibold">{formatDate(tournament.startDate)}</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/80 border-primary/20 shadow-sm">
                      <CardContent className="pt-6 space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Registered
                        </p>
                        <p className="text-xl font-semibold">
                          {participants.length}
                          {tournament.maxParticipants ? ` / ${tournament.maxParticipants}` : ""} players
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-background/80 border-primary/20 shadow-sm">
                      <CardContent className="pt-6 space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Prize Pool
                        </p>
                        <p className="text-xl font-semibold text-primary">{tournament.prizePool} SOL</p>
                        <p className="text-xs text-muted-foreground">Entry Fee: {tournament.entryFee} SOL</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Card className="bg-background/80 border-primary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Event Quick Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      View the bracket projections, confirm your registration details, or share this event with your
                      team.
                    </p>
                    <div className="flex flex-col gap-3">
                      <Button asChild className="w-full">
                        <Link href="/tournaments">Register or Edit Entry</Link>
                      </Button>
                      {tournament.challonge?.url && (
                        <Button variant="outline" asChild className="w-full">
                          <a href={tournament.challonge.url} target="_blank" rel="noreferrer">
                            Open Challonge Bracket
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="grid lg:grid-cols-[1.2fr,0.8fr] gap-6">
              <Card className="border-2 border-border/80">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-2xl">Registered Players</CardTitle>
                  <Badge variant="secondary">{participants.length} signed up</Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {participants.length === 0 ? (
                    <p className="text-muted-foreground">No players have registered yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center justify-between rounded-xl border border-border p-4 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src="/placeholder-user.jpg" alt={participant.in_game_username} />
                              <AvatarFallback>
                                {participant.in_game_username?.charAt(0).toUpperCase() ||
                                  participant.wallet_address.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold">{participant.in_game_username || "Unknown player"}</p>
                              <p className="text-sm text-muted-foreground">
                                Team: {participant.team_name || "Solo"} • Wallet:{" "}
                                {`${participant.wallet_address.slice(0, 4)}...${participant.wallet_address.slice(-4)}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {participant.status || "registered"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-2 border-border/80">
                <CardHeader>
                  <CardTitle className="text-2xl">Event Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Kick-off: {formatDate(tournament.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span>Projected Prize Pool: {tournament.prizePool} SOL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Participants: {participants.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Game: {tournament.game}</span>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4 text-foreground border border-border">
                    <p className="font-semibold mb-1">Format</p>
                    <p className="text-sm text-muted-foreground">
                      Single-elimination bracket seeded by registration order. Future rounds automatically pair winners
                      to keep the bracket aligned with Challonge projections.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card className="border-2 border-border/80">
              <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle className="text-2xl">Bracket Projection</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visual bracket built from registered players to mirror expected Challonge matchups.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="flex items-start gap-6 min-w-full">
                    {bracketRounds.map((round, roundIndex) => (
                      <div key={round.name} className="min-w-[240px] space-y-3">
                        <div className="px-2 py-1 rounded-md bg-muted text-sm font-semibold text-center">
                          {round.name}
                        </div>
                        {round.matches.map((match, matchIndex) => (
                          <div
                            key={`${round.name}-${matchIndex}`}
                            className="border border-border rounded-xl bg-card/70 shadow-sm p-4 space-y-2"
                          >
                            <div className="text-xs text-muted-foreground">Match {matchIndex + 1}</div>
                            <div className="flex flex-col gap-2">
                              {[match.home, match.away].map((side, sideIndex) => {
                                const isBye = side === "Open Slot"
                                return (
                                  <div
                                    key={sideIndex}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
                                      isBye ? "bg-muted/40 text-muted-foreground" : "bg-primary/5"
                                    }`}
                                  >
                                    <span
                                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                                        sideIndex === 0 ? "bg-primary/10 text-primary" : "bg-secondary text-foreground"
                                      }`}
                                    >
                                      {sideIndex === 0 ? "A" : "B"}
                                    </span>
                                    <span className="text-sm font-medium">{side}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        {roundIndex < bracketRounds.length - 1 && (
                          <div className="h-full w-px bg-gradient-to-b from-transparent via-border to-transparent mx-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  )
}
