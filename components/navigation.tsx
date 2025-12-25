"use client"

import Link from "next/link"
import { Wallet, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileDropdown } from "@/components/profile-dropdown"
import { useWallet } from "@/components/wallet-provider"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"

export function Navigation() {
  const { connected, connecting, connect } = useWallet()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname?.startsWith(path)) return true
    return false
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/tournaments", label: "Tournaments" },
    { href: "/teams", label: "Teams" },
    { href: "/leaderboards", label: "Leaderboards" }, // Added Leaderboards navigation link
    { href: "/mission", label: "Mission" },
    { href: "/championship", label: "Championship" },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center">
            <img src="/sol-arena-text-logo.png" alt="Sol Arena" className="h-8 w-auto object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  isActive(link.href) && (link.href === "/" ? pathname === "/" : true)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Wallet Button */}
          <div className="hidden md:block">
            {connected ? (
              <ProfileDropdown />
            ) : (
              <Button size="sm" onClick={connect} disabled={connecting}>
                <Wallet className="w-4 h-4 mr-2" />
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {connected ? (
              <ProfileDropdown />
            ) : (
              <Button size="sm" onClick={connect} disabled={connecting} className="text-xs px-2">
                <Wallet className="w-4 h-4" />
              </Button>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="px-2">
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                        isActive(link.href) && (link.href === "/" ? pathname === "/" : true)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  {!connected && (
                    <Button
                      onClick={() => {
                        connect()
                        setMobileMenuOpen(false)
                      }}
                      disabled={connecting}
                      className="mt-4"
                    >
                      <Wallet className="w-4 h-4 mr-2" />
                      {connecting ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
