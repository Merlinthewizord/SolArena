"use client"

import { useEffect, useRef, useState } from "react"

export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <video ref={videoRef} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-20">
          <source src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/compressed-video%20%281%29-azhSAVr9PobFGIPTbwJ8pMFiR4Tyes.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-background/60" />
      </div>
    </div>
  )
}

export default VideoBackground
