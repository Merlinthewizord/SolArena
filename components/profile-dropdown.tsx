"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Trophy } from "lucide-react"
import { useWallet } from "./wallet-provider"
import { useRouter } from "next/navigation"

export function ProfileDropdown() {
  const { profile, disconnect } = useWallet()
  const router = useRouter()

  if (!profile) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <User className="w-4 h-4" />
          <span className="font-medium">{profile.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2 text-sm">
          <div className="font-medium">{profile.username}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {profile.wallet_address?.slice(0, 4)}...{profile.wallet_address?.slice(-4)}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
          <Trophy className="w-4 h-4 mr-2" />
          View My Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="cursor-pointer text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
