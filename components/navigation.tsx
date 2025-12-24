"use client"

import Link from "next/link"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { useWallet } from "@/components/wallet-provider"
import { usePathname } from "next/navigation"

export function Navigation() {
  const { connected, connecting, connect } = useWallet()
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname?.startsWith(path)) return true
    return false
  }

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <img src="/sol-arena-text-logo.png" alt="Sol Arena" className="h-8 w-auto object-contain" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm transition-colors ${
                isActive("/") && pathname === "/"
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Home
            </Link>
            <Link
              href="/tournaments"
              className={`text-sm transition-colors ${
                isActive("/tournaments") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tournaments
            </Link>
            <Link
              href="/teams"
              className={`text-sm transition-colors ${
                isActive("/teams") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Teams
            </Link>
            <Link
              href="/mission"
              className={`text-sm transition-colors ${
                isActive("/mission") ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mission
            </Link>
            <Link
              href="/championship"
              className={`text-sm transition-colors ${
                isActive("/championship")
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Championship
            </Link>
          </div>

          {connected ? (
            <ProfileDropdown />
          ) : (
            <Button size="sm" onClick={connect} disabled={connecting}>
              <Wallet className="w-4 h-4 mr-2" />
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
