"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"
import { ProfileSignupModal, type ProfileData } from "./profile-signup-modal"
import { supabase } from "@/lib/supabase/client"

interface PhantomProvider {
  publicKey: { toString: () => string } | null
  connect: () => Promise<{ publicKey: { toString: () => string } }>
  disconnect: () => Promise<void>
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>
  isPhantom: boolean
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

  const refreshProfile = async () => {
    if (!publicKey) return

    const { data, error } = await supabase.from("player_profiles").select("*").eq("wallet_address", publicKey).single()

    if (data && !error) {
      setProfile(data)
    }
  }

  useEffect(() => {
    const checkExistingProfile = async () => {
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

  const createProfile = async (walletAddress: string, signature: string, profileData: ProfileData) => {
    const { data, error } = await supabase
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
      const provider = getPhantomProvider()
      if (!provider) {
        throw new Error("Phantom wallet not found")
      }

      let walletAddress: string
      if (!provider.publicKey) {
        const response = await provider.connect()
        walletAddress = response.publicKey.toString()
      } else {
        walletAddress = provider.publicKey.toString()
      }

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
      throw error
    }
  }

  const connect = async () => {
    setConnecting(true)

    try {
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

      const response = await provider.connect()
      const walletAddress = response.publicKey.toString()

      const { data: existingProfile, error } = await supabase
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
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet",
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
