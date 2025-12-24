"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useToast } from "@/hooks/use-toast"

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
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  getProvider: () => PhantomProvider | null
}

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  connected: false,
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
  getProvider: () => null,
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if user already has a profile
    const storedProfile = localStorage.getItem("solArenaProfile")
    if (storedProfile) {
      const profile = JSON.parse(storedProfile)
      setPublicKey(profile.walletAddress)
      setConnected(true)
    }
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

  const createProfile = async (walletAddress: string, signature: string) => {
    const profile = {
      walletAddress,
      signature,
      createdAt: new Date().toISOString(),
      username: `Player_${walletAddress.slice(0, 6)}`,
      wins: 0,
      losses: 0,
      totalEarnings: 0,
    }

    localStorage.setItem("solArenaProfile", JSON.stringify(profile))
    console.log("[v0] Profile created:", profile)
    return profile
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

      // Check if profile already exists
      const existingProfile = localStorage.getItem("solArenaProfile")

      if (existingProfile) {
        const profile = JSON.parse(existingProfile)
        setPublicKey(profile.walletAddress)
        setConnected(true)
        toast({
          title: "Welcome Back!",
          description: `Connected as ${profile.username}`,
        })
      } else {
        // Request signature to create profile
        const message = `Sign this message to create your Sol Arena profile.\n\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`
        const encodedMessage = new TextEncoder().encode(message)

        const { signature } = await provider.signMessage(encodedMessage)
        const signatureBase64 = Buffer.from(signature).toString("base64")

        // Create profile with signature
        const profile = await createProfile(walletAddress, signatureBase64)

        setPublicKey(walletAddress)
        setConnected(true)

        toast({
          title: "Profile Created!",
          description: `Welcome to Sol Arena, ${profile.username}!`,
        })
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
      value={{ publicKey, connected, connecting, connect, disconnect, getProvider: getPhantomProvider }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  return useContext(WalletContext)
}
