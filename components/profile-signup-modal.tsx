"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProfileSignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (profileData: ProfileData) => Promise<void>
}

export interface ProfileData {
  username: string
  bio: string
  location: string
  favoriteGames: string[]
  profileImageUrl: string
}

const AVAILABLE_GAMES = ["Fortnite", "The Finals", "Call of Duty", "Apex Legends", "Valorant", "CS2"]

export function ProfileSignupModal({ open, onOpenChange, onComplete }: ProfileSignupModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    bio: "",
    location: "",
    favoriteGames: [],
    profileImageUrl: "",
  })
  const [imagePreview, setImagePreview] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setFormData((prev) => ({ ...prev, profileImageUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const toggleGame = (game: string) => {
    setFormData((prev) => ({
      ...prev,
      favoriteGames: prev.favoriteGames.includes(game)
        ? prev.favoriteGames.filter((g) => g !== game)
        : [...prev.favoriteGames, game],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username",
        variant: "destructive",
      })
      return
    }

    if (formData.favoriteGames.length === 0) {
      toast({
        title: "Select a game",
        description: "Please select at least one favorite game",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await onComplete(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Profile signup error:", error)
      toast({
        title: "Profile creation failed",
        description: error instanceof Error ? error.message : "Failed to create profile",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create Your Player Profile</DialogTitle>
          <DialogDescription>
            Complete your profile to start competing in tournaments. This information will be saved to your wallet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Profile Image */}
          <div className="space-y-2">
            <Label htmlFor="profile-image">Profile Image</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Profile preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
                    onClick={() => {
                      setImagePreview("")
                      setFormData((prev) => ({ ...prev, profileImageUrl: "" }))
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground mt-1">Upload a profile picture (max 5MB)</p>
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Username <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              placeholder="Enter your gamer tag"
              value={formData.username}
              onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="City, Country"
              value={formData.location}
              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Favorite Games */}
          <div className="space-y-2">
            <Label>
              Favorite Games <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GAMES.map((game) => (
                <Badge
                  key={game}
                  variant={formData.favoriteGames.includes(game) ? "default" : "outline"}
                  className="cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => toggleGame(game)}
                >
                  {game}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Select your favorite games</p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Creating Profile..." : "Save & Sign with Wallet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
