"use client"

import type React from "react"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Trophy, Calendar, MapPin, Users, Star, ArrowRight, Crown } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { VideoBackground } from "@/components/video-background"

export default function ChampionshipPage() {
  const { publicKey, connected, connecting, connect } = useWallet()
  const [showPreRegister, setShowPreRegister] = useState(false)
  const [preRegisterForm, setPreRegisterForm] = useState({
    email: "",
    name: "",
    discord: "",
    country: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()

      const registrationData = {
        email: preRegisterForm.email,
        full_name: preRegisterForm.name,
        discord_username: preRegisterForm.discord || null,
        country: preRegisterForm.country,
        wallet_address: publicKey || null,
      }

      const { data, error } = await supabase.from("championship_registrations").insert(registrationData).select()

      if (error) {
        console.error("[v0] Supabase error:", error)
        throw error
      }

      console.log("[v0] Championship pre-registration saved to database:", data)

      setSubmitted(true)
      setTimeout(() => {
        setShowPreRegister(false)
        setSubmitted(false)
        setPreRegisterForm({ email: "", name: "", discord: "", country: "" })
      }, 2000)
    } catch (error) {
      console.error("[v0] Error submitting pre-registration:", error)
      alert("Error submitting registration. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <VideoBackground />

      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-background via-secondary/30 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="container mx-auto max-w-7xl relative">
          <div className="text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-primary font-semibold">Annual Championship Event</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-bold leading-tight text-balance">
              Grand Sol Arena
              <br />
              <span className="text-primary">Championship</span>
            </h1>

            <p className="text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The ultimate esports showdown. 1,000 SOL grand prize. Las Vegas.
            </p>

            {/* Event Details Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
              <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Grand Prize</p>
                    <p className="text-4xl font-bold text-primary">1,000 SOL</p>
                    <p className="text-sm text-muted-foreground">≈ $200,000 USD</p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Date</p>
                    <p className="text-4xl font-bold">Dec 2025</p>
                    <p className="text-sm text-muted-foreground">3-Day Event</p>
                  </div>
                </div>
              </Card>

              <Card className="p-8 bg-card/50 backdrop-blur border-2 border-primary/20">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Location</p>
                    <p className="text-4xl font-bold">Las Vegas</p>
                    <p className="text-sm text-muted-foreground">Caesars Palace</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => setShowPreRegister(true)}>
                Pre-Register Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent">
                View Schedule
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Prize Breakdown */}
      <section className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">Prize Distribution</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Over 1,500 SOL in total prizes across all categories
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative p-10 bg-gradient-to-br from-primary/20 to-secondary/30 border-2 border-primary/50 overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1st
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">Grand Champion</h3>
                  <p className="text-5xl font-bold text-primary">1,000 SOL</p>
                  <p className="text-muted-foreground">Plus trophy & championship belt</p>
                </div>
              </div>
            </Card>

            <Card className="p-10 bg-card border-2 border-border">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-foreground text-xl font-bold">
                  2nd
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">Runner Up</h3>
                  <p className="text-5xl font-bold text-primary">400 SOL</p>
                  <p className="text-muted-foreground">Plus silver trophy</p>
                </div>
              </div>
            </Card>

            <Card className="p-10 bg-card border-2 border-border">
              <div className="space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted text-foreground text-xl font-bold">
                  3rd
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-bold">Third Place</h3>
                  <p className="text-5xl font-bold text-primary">200 SOL</p>
                  <p className="text-muted-foreground">Plus bronze trophy</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="inline-block p-6 bg-secondary/50 border-2 border-border">
              <p className="text-lg">
                <span className="text-muted-foreground">Total Prize Pool:</span>{" "}
                <span className="text-3xl font-bold text-primary ml-2">1,500+ SOL</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Event Format */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">Event Format</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three days of intense competition in Las Vegas
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            <Card className="p-8 bg-card border-2 border-border">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">Day 1</p>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-2xl font-bold">Qualifiers</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    256 players compete in initial rounds. Top 64 advance to Day 2. Double elimination format ensures
                    everyone gets a fair shot at glory.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card border-2 border-border">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">Day 2</p>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-2xl font-bold">Semifinals</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    64 players battle through bracket play. Intense matches narrow the field to the top 8 finalists who
                    will compete for the championship on Day 3.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-card border-2 border-border">
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0 w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">Day 3</p>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-2xl font-bold">Grand Finals</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The top 8 compete in the championship bracket. Winner takes home 1,000 SOL and eternal glory as the
                    first Grand Sol Arena Champion. Live streamed globally.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Venue */}
      <section className="py-20 px-4 bg-secondary/30 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-bold text-balance">World-Class Venue</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Held at the legendary Caesars Palace in Las Vegas, the championship will feature state-of-the-art
                  gaming facilities, massive LED screens, and luxury accommodations.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Caesars Palace</h3>
                    <p className="text-muted-foreground">3570 Las Vegas Blvd South, Las Vegas, NV 89109</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Live Audience</h3>
                    <p className="text-muted-foreground">
                      2,000+ seat arena with VIP viewing areas and meet & greet opportunities
                    </p>
                  </div>
                </div>
              </div>

              <Button size="lg" className="text-lg">
                Book Your Tickets
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl" />
              <Card className="relative p-8 bg-card/80 backdrop-blur border-2 border-border">
                <div className="space-y-6">
                  <div className="aspect-video bg-secondary/50 rounded-xl flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold">Event Package Includes:</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Championship tournament entry
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />3 nights at Caesars Palace
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        VIP player lounge access
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Exclusive networking events
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Championship merchandise
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsors */}
      <section className="py-20 px-4 relative z-10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-balance">Sponsored By</h2>
            <p className="text-xl text-muted-foreground">Powered by the leading protocols in the Solana ecosystem</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: "Jupiter", desc: "DEX Aggregator" },
              { name: "Magic Eden", desc: "NFT Marketplace" },
              { name: "Phantom", desc: "Wallet Provider" },
              { name: "Drift Protocol", desc: "DeFi Platform" },
              { name: "Solana Foundation", desc: "Blockchain Network" },
              { name: "Marinade Finance", desc: "Liquid Staking" },
              { name: "Tensor", desc: "NFT Trading" },
              { name: "Jito", desc: "MEV Solutions" },
            ].map((sponsor) => (
              <Card
                key={sponsor.name}
                className="p-8 flex flex-col items-center justify-center gap-3 bg-card border-2 border-border hover:border-primary/50 transition-all"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{sponsor.name}</p>
                  <p className="text-xs text-muted-foreground">{sponsor.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pre-Registration Modal */}
      {showPreRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-2 border-primary/20">
            <div className="p-8 space-y-6">
              {!submitted ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-3xl font-bold">Pre-Register</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreRegister(false)}
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                    <p className="text-muted-foreground">
                      Secure your spot for the Grand Sol Arena Championship 2025. Limited slots available.
                    </p>
                  </div>

                  <form onSubmit={handlePreRegister} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={preRegisterForm.email}
                        onChange={(e) => setPreRegisterForm({ ...preRegisterForm, email: e.target.value })}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={preRegisterForm.name}
                        onChange={(e) => setPreRegisterForm({ ...preRegisterForm, name: e.target.value })}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Discord Username</label>
                      <input
                        type="text"
                        value={preRegisterForm.discord}
                        onChange={(e) => setPreRegisterForm({ ...preRegisterForm, discord: e.target.value })}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="username#0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Country *</label>
                      <input
                        type="text"
                        required
                        value={preRegisterForm.country}
                        onChange={(e) => setPreRegisterForm({ ...preRegisterForm, country: e.target.value })}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="United States"
                      />
                    </div>

                    {connected && publicKey && (
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Connected Wallet</p>
                        <p className="text-sm font-mono">
                          {publicKey.slice(0, 8)}...{publicKey.slice(-8)}
                        </p>
                      </div>
                    )}

                    {!connected && (
                      <div className="p-4 bg-muted/50 border border-border rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Connect your Solana wallet to link it with your registration
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 bg-transparent"
                        onClick={() => setShowPreRegister(false)}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1" disabled={submitting}>
                        {submitting ? "Submitting..." : "Complete Registration"}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">Registration Successful!</h3>
                  <p className="text-muted-foreground">You&apos;ll receive updates about the championship via email.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
