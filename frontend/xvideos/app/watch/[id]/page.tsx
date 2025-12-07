"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getVideoById } from "@/lib/videos"
import { AdPopup } from "@/components/video/ad-popup"

export default function WatchPage() {
  const params = useParams()
  const videoId = params.id as string
  const video = getVideoById(videoId)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [showAdPopup, setShowAdPopup] = useState(true) // DEBUG: Force show
  const [adDismissed, setAdDismissed] = useState(false)

  // Track video time and show ad popup during ad segment
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || !video?.ad) return

    const handleTimeUpdate = () => {
      const currentTime = videoElement.currentTime
      const ad = video.ad!
      
      // Show popup during ad segment (unless dismissed)
      if (currentTime >= ad.startTime && currentTime <= ad.endTime && !adDismissed) {
        setShowAdPopup(true)
      } else {
        setShowAdPopup(false)
      }
    }

    videoElement.addEventListener("timeupdate", handleTimeUpdate)
    return () => videoElement.removeEventListener("timeupdate", handleTimeUpdate)
  }, [video, adDismissed])

  // Reset dismissed state when video changes
  useEffect(() => {
    setAdDismissed(false)
    setShowAdPopup(false)
  }, [videoId])

  const handleDismissAd = () => {
    setAdDismissed(true)
    setShowAdPopup(false)
  }

  if (!video) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col items-center justify-center text-white">
        <h1 className="text-2xl font-bold mb-4">Video not found</h1>
        <Link href="/" className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg">
          Back to Home
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/" className="text-white hover:text-gray-300 transition">
          <ArrowLeft className="w-8 h-8" />
        </Link>
        <div>
          <h1 className="text-xl font-medium text-white">{video.title}</h1>
          <p className="text-sm text-gray-400">{video.year} • {video.genre} • {video.duration}</p>
        </div>
      </div>

      {/* Native HTML5 Video Player */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={video.videoUrl}
        poster={video.thumbnail}
        controls
        autoPlay
        controlsList="nodownload"
      />

      {/* Ad Popup */}
      {video.ad && (
        <AdPopup 
          ad={video.ad}
          visible={showAdPopup}
          onDismiss={handleDismissAd}
        />
      )}
    </div>
  )
}
