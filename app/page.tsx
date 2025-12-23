"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Wallet, Users, Zap, Shield, ArrowRight } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"

export default function HomePage() {
  const { publicKey, connected, connecting, connect, disconnect } = useWallet()

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Sol Arena</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#tournaments" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Tournaments
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                How It Works
              </a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </a>
            </div>
            {connected ? (
              <Button size="sm" variant="outline" onClick={disconnect}>
                <Wallet className="w-4 h-4 mr-2" />
                {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
              </Button>
            ) : (
              <Button size="sm" onClick={connect} disabled={connecting}>
                <Wallet className="w-4 h-4 mr-2" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-primary">Live on Solana</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-balance">
                Compete. Win. <span className="text-primary">Earn SOL.</span>
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                Enter winner-takes-all tournaments with your Solana wallet. Create your profile, join competitions, and
                claim the entire prize pool.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {connected ? (
                  <Button size="lg" className="text-base">
                    View My Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button size="lg" className="text-base" onClick={connect} disabled={connecting}>
                    {connecting ? "Connecting..." : "Get Started"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                <Button size="lg" variant="outline" className="text-base bg-transparent">
                  View Tournaments
                </Button>
              </div>

              <div className="flex items-center gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-primary">2.4K+</div>
                  <div className="text-sm text-muted-foreground">Active Players</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">15 SOL</div>
                  <div className="text-sm text-muted-foreground">Total Prizes</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div>
                  <div className="text-3xl font-bold text-primary">98%</div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                </div>
              </div>
            </div>

            <div className="flex-1 relative">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" />
                <Card className="relative p-6 border-2 border-primary/20 bg-card/50 backdrop-blur">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Live Tournament</span>
                      <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        Active
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold">Battle Royale #42</h3>
                      <p className="text-sm text-muted-foreground">Entry: 0.1 SOL</p>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Prize Pool</span>
                        <span className="text-2xl font-bold text-primary">2.4 SOL</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>24 players entered</span>
                      </div>
                    </div>
                    <Button className="w-full" size="lg">
                      Join Tournament
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">How Sol Arena Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to start competing and winning
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center space-y-4 bg-card border-2 border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  1
                </div>
                <h3 className="text-2xl font-bold">Connect Wallet</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Link your Solana wallet and create your player profile in seconds
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center space-y-4 bg-card border-2 border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  2
                </div>
                <h3 className="text-2xl font-bold">Enter Tournament</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Choose a tournament and pay the entry fee in SOL to join the competition
                </p>
              </div>
            </Card>

            <Card className="p-8 text-center space-y-4 bg-card border-2 border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-2">
                  3
                </div>
                <h3 className="text-2xl font-bold">Claim Rewards</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Win the tournament and instantly receive the entire prize pool in your wallet
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold text-balance">Built for competitors on Solana</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Fast, secure, and transparent tournament platform powered by blockchain technology
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Secure & Transparent</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      All transactions on-chain with instant payouts to winners
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Lightning Fast</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Powered by Solana for near-instant transaction speeds
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">Winner Takes All</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Simple format - winner receives the entire prize pool
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Avg Entry</div>
                  <div className="text-3xl font-bold text-primary">0.15 SOL</div>
                </Card>
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Avg Prize</div>
                  <div className="text-3xl font-bold text-primary">3.2 SOL</div>
                </Card>
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Total Players</div>
                  <div className="text-3xl font-bold">2,431</div>
                </Card>
                <Card className="p-6 space-y-2 bg-card border-2 border-border">
                  <div className="text-sm text-muted-foreground">Tournaments</div>
                  <div className="text-3xl font-bold">158</div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="relative overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/30">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
            <div className="relative p-12 text-center space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-balance">Ready to compete?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of players competing for SOL rewards. Connect your wallet and enter your first tournament
                today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                {connected ? (
                  <Button size="lg" className="text-base">
                    View My Dashboard
                  </Button>
                ) : (
                  <Button size="lg" className="text-base" onClick={connect} disabled={connecting}>
                    <Wallet className="w-5 h-5 mr-2" />
                    {connecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                )}
                <Button size="lg" variant="outline" className="text-base bg-transparent">
                  View Live Tournaments
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">Sol Arena</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                About
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Support
              </a>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 Sol Arena. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
