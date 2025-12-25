"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { ProfileSignupModal, type ProfileData } from "./profile-signup-modal"
import { createBrowserClient } from "@/lib/supabase/client"

interface PhantomProvider {
  publicKey: { toString: () => string } | null
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  isPhantom: boolean
  isConnected?: boolean
}

interface WalletContextType {
  publicKey: string | null
  connected: boolean
  connecting: boolean
  profile: any | null
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getProvider: () => PhantomProvider | null
  refreshProfile: () => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  connected: false,
  connecting: false,
  profile: null,
  connect: async () => {},
  disconnect: async () => {},
  getProvider: () => null,
  refreshProfile: async () => {},
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profile, setProfile] = useState<any | null>(null)
  const { toast } = useToast()
  const supabase = useMemo(() => createBrowserClient(), [])

  const ensureSupabase = () => {
    if (supabase) return supabase
    toast({
      title: "Service unavailable",
      description: "Supabase is not configured. Please check environment variables and try again.",
      variant: "destructive",
    })
    return null
  }

  const refreshProfile = async () => {
    if (!publicKey || !supabase) return

    const { data, error } = await supabase.from("player_profiles").select("*").eq("wallet_address", publicKey).single()

    if (data && !error) {
      setProfile(data)
    }
  }

  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!supabase) return
      const provider = getPhantomProvider()
      if (provider?.publicKey) {
        const walletAddress = provider.publicKey.toString()

        const { data, error } = await supabase
          .from("player_profiles")
          .select("*")
          .eq("wallet_address", walletAddress)
          .single()

        if (data && !error) {
          setPublicKey(walletAddress)
          setConnected(true)
          setProfile(data)
        }
      }
    }

    checkExistingProfile()
  }, [])

  const getPhantomProvider = (): PhantomProvider | null => {
    if (typeof window !== "undefined" && "phantom" in window) {
      const provider = (window as any).phantom?.solana
      if (provider?.isPhantom) {
        return provider
      }
    }
    return null
  }

  const mapWalletError = (error: unknown) => {
    if (error && typeof error === "object" && "message" in error) {
      const rawMessage = String((error as any).message)
      const message = rawMessage.toLowerCase()
      if (message.includes("rejected")) return "You rejected the connection request in Phantom."
      if (message.includes("locked")) return "Unlock your Phantom wallet and try again."
      if (message.includes("network")) return "Check your connection and try again."
      if (message.includes("unexpected")) return "Phantom returned an unexpected error. Please retry after reopening your wallet."
      if (message.includes("already") || message.includes("pending")) {
        return "Phantom is still handling a previous request. Please try again."
      }
      return rawMessage
    }
    return "Failed to connect wallet"
  }

  const getWalletAddress = async (provider: PhantomProvider) => {
    if (provider.publicKey) return provider.publicKey.toString()

    const attemptConnection = async (options?: { onlyIfTrusted?: boolean }) => {
      const response = await provider.connect(options)
      return response.publicKey.toString()
    }

    try {
      // Try a trusted connection first to reuse existing approvals
      const walletAddress = await attemptConnection({ onlyIfTrusted: true })
      if (walletAddress) return walletAddress
    } catch (error) {
      console.warn("[v0] Trusted Phantom connection failed, retrying with prompt:", error)
    }

    try {
      return await attemptConnection()
    } catch (error) {
      const message = error && typeof error === "object" && "message" in error ? String((error as any).message) : ""

      if (message.toLowerCase().includes("already") || message.toLowerCase().includes("pending")) {
        try {
          await provider.disconnect()
        } catch (disconnectError) {
          console.warn("[v0] Phantom disconnect during retry failed:", disconnectError)
        }
        return await attemptConnection()
      }

      throw error
    }
  }

  const createProfile = async (walletAddress: string, signature: string, profileData: ProfileData) => {
    const client = ensureSupabase()
    if (!client) throw new Error("Supabase is not configured")

    const { data, error } = await client
      .from("player_profiles")
      .insert({
        wallet_address: walletAddress,
        username: profileData.username,
        bio: profileData.bio,
        location: profileData.location,
        favorite_games: profileData.favoriteGames,
        profile_image_url: profileData.profileImageUrl,
        signature: signature,
        wins: 0,
        losses: 0,
        total_earnings: 0,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving profile to database:", error)
      throw new Error("Failed to save profile to database")
    }

    console.log("[v0] Profile created in database:", data)
    return data
  }

  const handleProfileComplete = async (profileData: ProfileData) => {
    try {
      const client = ensureSupabase()
      if (!client) return

      const provider = getPhantomProvider()
      if (!provider) {
        throw new Error("Phantom wallet not found")
      }

      const walletAddress = await getWalletAddress(provider)

      const message = `Sign this message to create your Sol Arena profile.\n\nWallet: ${walletAddress}\nUsername: ${profileData.username}\nTimestamp: ${new Date().toISOString()}`
      const encodedMessage = new TextEncoder().encode(message)

      const { signature } = await provider.signMessage(encodedMessage)
      const signatureBase64 = Buffer.from(signature).toString("base64")

      const profile = await createProfile(walletAddress, signatureBase64, profileData)

      setPublicKey(walletAddress)
      setConnected(true)
      setProfile(profile)

      toast({
        title: "Profile Created!",
        description: `Welcome to Sol Arena, ${profile.username}!`,
      })
    } catch (error) {
      console.error("[v0] Profile creation error:", error)
      throw error instanceof Error ? error : new Error(mapWalletError(error))
    }
  }

  const connect = async () => {
    setConnecting(true)

    try {
      const client = ensureSupabase()
      if (!client) {
        setConnecting(false)
        return
      }
      const provider = getPhantomProvider()

      if (!provider) {
        toast({
          title: "Phantom Not Found",
          description: "Please install Phantom wallet to continue.",
          variant: "destructive",
        })
        window.open("https://phantom.app/", "_blank")
        setConnecting(false)
        return
      }

      const walletAddress = await getWalletAddress(provider)

      const { data: existingProfile, error } = await client
        .from("player_profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single()

      if (existingProfile && !error) {
        setPublicKey(walletAddress)
        setConnected(true)
        setProfile(existingProfile)
        toast({
          title: "Welcome Back!",
          description: `Connected as ${existingProfile.username}`,
        })
      } else {
        setShowProfileModal(true)
      }
    } catch (error) {
      console.error("[v0] Wallet connection error:", error)
      const description = mapWalletError(error)
      toast({
        title: "Connection Failed",
        description,
        variant: "destructive",
      })
    } finally {
      setConnecting(false)
    }
  }

  const disconnect = async () => {
    try {
      const provider = getPhantomProvider()
      if (provider) {
        await provider.disconnect()
      }

      setPublicKey(null)
      setConnected(false)
      setProfile(null)

      toast({
        title: "Disconnected",
        description: "Wallet disconnected successfully",
      })
    } catch (error) {
      console.error("[v0] Disconnect error:", error)
    }
  }

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        connected,
        connecting,
        profile,
        connect,
        disconnect,
        getProvider: getPhantomProvider,
        refreshProfile,
      }}
    >
      {children}
      <ProfileSignupModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onComplete={handleProfileComplete}
      />
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}
