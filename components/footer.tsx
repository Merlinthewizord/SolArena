"use client"

import Link from "next/link"
import Image from "next/image"
import { ExternalLink, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Footer() {
  return (
    <footer className="border-t border-border py-12 px-4 relative z-10 bg-background">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col items-center gap-4 pb-8 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-[120px] h-[120px] relative">
                <Image
                  src="/sol-arena-logo.png"
                  alt="Sol Arena Logo"
                  width={120}
                  height={120}
                  className="object-contain"
                />
              </div>
              <div>
                <div className="text-lg font-bold">$ARENA Token</div>
                <div className="text-xs text-muted-foreground">Official Sol Arena Token</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <TokenAddress address="egimFKq4YU5N2r3B3BCZby5WVoFbbS1EhRLcnqwpump" />

              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://dexscreener.com/solana/egimFKq4YU5N2r3B3BCZby5WVoFbbS1EhRLcnqwpump"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    DexScreener
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <a href="https://x.com/SolArenaGaming" target="_blank" rel="noopener noreferrer" className="gap-2">
                    Twitter
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Existing footer content */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-24 h-24 relative">
                <Image src="/sol-arena-logo.png" alt="Sol Arena" width={96} height={96} className="object-contain" />
              </div>
              <span className="text-lg font-bold">Sol Arena</span>
            </div>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/mission" className="hover:text-foreground transition-colors">
                Mission
              </Link>
              <Link href="/championship" className="hover:text-foreground transition-colors">
                Championship
              </Link>
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
      </div>
    </footer>
  )
}

function TokenAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copyToClipboard}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted hover:bg-muted/80 transition-colors text-xs font-mono group"
    >
      <span className="hidden sm:inline">{address}</span>
      <span className="sm:hidden">
        {address.slice(0, 8)}...{address.slice(-8)}
      </span>
      {copied ? (
        <span className="text-green-500 text-xs">Copied!</span>
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
      )}
    </button>
  )
}
