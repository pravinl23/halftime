"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getVideoById, parseDuration } from "@/lib/videos"
import { VideoPlayer } from "@/components/video/video-player"
import { AdPopup } from "@/components/video/ad-popup"
import { trackAdImpression, type AdTrackingContext } from "@/lib/analytics"

export default function WatchPage() {
  const params = useParams()
  const videoId = params.id as string
  const video = getVideoById(videoId)
  
  const [showAdPopup, setShowAdPopup] = useState(false)
  const [adDismissed, setAdDismissed] = useState(false)
  const [adImpressionTracked, setAdImpressionTracked] = useState(false)

  // Create tracking context
  const trackingContext: AdTrackingContext | undefined = video?.ad ? {
    ad: video.ad,
    videoId: videoId,
    showName: video.title,
    adPosition: video.ad.startTime
  } : undefined

  // Reset dismissed state when video changes
  useEffect(() => {
    setAdDismissed(false)
    setShowAdPopup(false)
    setAdImpressionTracked(false)
  }, [videoId])

  const handleAdStart = () => {
    if (!adDismissed) {
      setShowAdPopup(true)
      
      // Track impression once when ad starts
      if (!adImpressionTracked && trackingContext) {
        trackAdImpression(trackingContext)
        setAdImpressionTracked(true)
      }
    }
  }

  const handleAdEnd = () => {
    setShowAdPopup(false)
  }

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

      {/* Custom Video Player with Ad Markers */}
      <VideoPlayer
        src={video.videoUrl}
        poster={video.thumbnail}
        ad={video.ad}
        expectedDuration={parseDuration(video.duration)}
        onAdStart={handleAdStart}
        onAdEnd={handleAdEnd}
        className="w-full h-full"
        trackingContext={trackingContext}
      />

      {/* Ad Popup */}
      {video.ad && (
        <AdPopup 
          ad={video.ad}
          visible={showAdPopup}
          onDismiss={handleDismissAd}
          trackingContext={trackingContext}
        />
      )}
    </div>
  )
}
