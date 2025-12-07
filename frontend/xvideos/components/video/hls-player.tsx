"use client"

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react"
import Hls from "hls.js"

interface HLSPlayerProps {
  playlistUrl: string
  className?: string
  autoPlay?: boolean
  controls?: boolean
  onTimeUpdate?: (currentTime: number) => void
}

export interface HLSPlayerRef {
  reloadPlaylist: () => void
  getCurrentTime: () => number
}

export const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>(({
  playlistUrl,
  className = "",
  autoPlay = true,
  controls = true,
  onTimeUpdate
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Check if HLS is supported
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90
      })

      hlsRef.current = hls

      hls.loadSource(playlistUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false)
        if (autoPlay) {
          video.play().catch((e) => {
            console.error("Autoplay failed:", e)
          })
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Network error, trying to recover...")
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Media error, trying to recover...")
              hls.recoverMediaError()
              break
            default:
              console.error("Fatal error, cannot recover")
              setError("Failed to load video")
              hls.destroy()
              break
          }
        }
      })

      // Handle time updates
      if (onTimeUpdate) {
        const handleTimeUpdate = () => {
          onTimeUpdate(video.currentTime)
        }
        video.addEventListener("timeupdate", handleTimeUpdate)
        return () => {
          video.removeEventListener("timeupdate", handleTimeUpdate)
          hls.destroy()
        }
      }

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS support (Safari)
      video.src = playlistUrl
      setIsLoading(false)
      if (autoPlay) {
        video.play().catch((e) => {
          console.error("Autoplay failed:", e)
        })
      }

      if (onTimeUpdate) {
        const handleTimeUpdate = () => {
          onTimeUpdate(video.currentTime)
        }
        video.addEventListener("timeupdate", handleTimeUpdate)
        return () => {
          video.removeEventListener("timeupdate", handleTimeUpdate)
        }
      }
    } else {
      setError("HLS is not supported in this browser")
      setIsLoading(false)
    }
  }, [playlistUrl, autoPlay, onTimeUpdate])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    reloadPlaylist: () => {
      if (hlsRef.current && videoRef.current) {
        const currentTime = videoRef.current.currentTime
        hlsRef.current.loadSource(playlistUrl)
        hlsRef.current.once(Hls.Events.MANIFEST_PARSED, () => {
          if (videoRef.current) {
            videoRef.current.currentTime = currentTime
          }
        })
      } else if (videoRef.current) {
        videoRef.current.load()
      }
    },
    getCurrentTime: () => videoRef.current?.currentTime || 0
  }), [playlistUrl])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-black text-white ${className}`}>
        <div className="text-center">
          <p className="text-red-400 mb-2">{error}</p>
          <button
            onClick={reloadPlaylist}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="text-white">Loading video...</div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls={controls}
        playsInline
        preload="auto"
      />
    </div>
  )
})

