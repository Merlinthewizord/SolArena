"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Zap, Globe, Target, ArrowRight, Wallet } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { VideoBackground } from "@/components/video-background"
import Link from "next/link"
import { Navigation } from "@/components/navigation"

export default function MissionPage() {
  const { publicKey, connected, connecting, connect } = useWallet()

  return (
    <div className="min-h-screen">
      <VideoBackground />

      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

        <div className="container mx-auto max-w-5xl relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-primary">Our Vision</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-bold leading-tight text-balance">
              Onboarding All of <span className="text-primary">Esports</span> to Solana
            </h1>

            <p className="text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              We're building the future of competitive gaming where every match matters and every player gets paid
              fairly, instantly, and transparently.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-4xl">
          <Card className="p-12 lg:p-16 border-2 border-primary/20 bg-card/50 backdrop-blur space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-balance">
                The Problem with Traditional Esports
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Today's competitive gaming landscape is broken. Players compete for free, prize pools are delayed by
                months, platforms take massive cuts, and payment systems are opaque. The industry needs a revolution.
              </p>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight text-balance">
                Our Solution: <span className="text-primary">Blockchain-Powered Competition</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Sol Arena leverages Solana's lightning-fast blockchain to create a new paradigm for competitive gaming.
                Every tournament entry is secured in a smart contract escrow. Winners receive instant payouts. No
                middlemen. No delays. No hidden fees.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* The Grand Plan */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-5xl lg:text-6xl font-bold text-balance">The Grand Plan</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three phases to revolutionize competitive gaming on Solana
            </p>
          </div>

          <div className="space-y-8">
            {/* Phase 1 */}
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative p-8 lg:p-12 space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                    <Target className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-primary">Phase 1 · Foundation</div>
                      <h3 className="text-3xl lg:text-4xl font-bold">Prove the Model</h3>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Launch with popular titles like Fortnite and The Finals. Build a community of early adopters who
                      experience instant SOL payouts for tournament wins. Demonstrate that blockchain-based esports is
                      faster, fairer, and more transparent than traditional platforms.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Instant Payouts</div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">
                        Winner-Takes-All Format
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Low Entry Fees</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Phase 2 */}
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/20">
              <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative p-8 lg:p-12 space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                    <Zap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-primary">Phase 2 · Expansion</div>
                      <h3 className="text-3xl lg:text-4xl font-bold">Scale the Ecosystem</h3>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Expand to 10+ major esports titles. Introduce advanced tournament formats including team
                      competitions, bracket tournaments, and seasonal leagues. Partner with gaming organizations and
                      streamers to drive mass adoption. Enable anyone to create and host their own paid tournaments.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Multi-Game Support</div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Custom Tournaments</div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">
                        Prize Pool Structures
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Creator Economy</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Phase 3 */}
            <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/20">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative p-8 lg:p-12 space-y-6">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                    <Globe className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-primary">Phase 3 · Global Dominance</div>
                      <h3 className="text-3xl lg:text-4xl font-bold">Become the Standard</h3>
                    </div>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Establish Sol Arena as the default platform for competitive gaming worldwide. Launch professional
                      leagues with six-figure prize pools. Integrate with major esports organizations and game
                      publishers. Make Solana wallets as common as gaming accounts. Transform esports from a hobby into
                      a genuine career path for millions of players.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Pro Leagues</div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">
                        Publisher Partnerships
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">
                        Global Infrastructure
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">Career Platform</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Solana */}
      <section className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">Why Solana?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The only blockchain fast and cheap enough for competitive gaming
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-8 space-y-4 bg-card border-2 border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  400ms block times mean instant tournament payouts. Players receive winnings in seconds, not days or
                  weeks.
                </p>
              </div>
            </Card>

            <Card className="p-8 space-y-4 bg-card border-2 border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Negligible Fees</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Transactions cost fractions of a cent. Unlike Ethereum, Solana won't eat into prize pools with gas
                  fees.
                </p>
              </div>
            </Card>

            <Card className="p-8 space-y-4 bg-card border-2 border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Built to Scale</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Handles 65,000+ TPS. Can support millions of players competing in tournaments simultaneously
                  worldwide.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* The Future */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-5xl">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <div className="relative p-12 lg:p-16 space-y-8 text-center">
              <h2 className="text-5xl lg:text-6xl font-bold leading-tight text-balance">
                The Future is <span className="text-primary">Paid Competition</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                Imagine a world where every ranked match you play has real stakes. Where grinding isn't just for XP, but
                for actual earnings. Where your gaming skills translate directly into income. That's the future Sol
                Arena is building—one tournament at a time.
              </p>
              <div className="pt-4">
                <p className="text-2xl font-bold mb-8">Join us in revolutionizing esports.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {connected ? (
                    <Button size="lg" className="text-base" asChild>
                      <Link href="/tournaments">
                        Enter a Tournament
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button size="lg" className="text-base" onClick={connect} disabled={connecting}>
                      <Wallet className="w-5 h-5 mr-2" />
                      {connecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  )}
                  <Button size="lg" variant="outline" className="text-base bg-transparent" asChild>
                    <Link href="/">Learn More</Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-primary">100M+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Target Players by 2030</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-primary">$1B+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Annual Prize Pools</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Games Supported</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold text-primary">0%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Platform Fees</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Sol Arena</span>
            </Link>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/mission" className="hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link href="/tournaments" className="hover:text-foreground transition-colors">
                Tournaments
              </Link>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 Sol Arena. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
