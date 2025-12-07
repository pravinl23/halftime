"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings
} from "lucide-react"

interface SimplePlayerProps {
  src: string
  poster?: string
  title?: string
  className?: string
  autoPlay?: boolean
  onEnded?: () => void
}

export function SimplePlayer({
  src,
  poster,
  title,
  className = "",
  autoPlay = false,
  onEnded
}: SimplePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [buffered, setBuffered] = useState(0)

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Seek to position
  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
  }, [duration])

  // Handle progress bar click
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progress = progressRef.current
    const video = videoRef.current
    if (!progress || !video) return

    const rect = progress.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * duration
  }, [duration])

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }, [])

  // Show controls on mouse move
  const handleMouseMove = useCallback(() => {
    setShowControls(true)
    
    if (hideControlsTimeout.current) {
      clearTimeout(hideControlsTimeout.current)
    }

    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if video player is focused or in fullscreen
      if (!containerRef.current?.contains(document.activeElement) && !isFullscreen) return

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "arrowleft":
          e.preventDefault()
          skip(-10)
          break
        case "arrowright":
          e.preventDefault()
          skip(10)
          break
        case "arrowup":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.volume = Math.min(1, volume + 0.1)
            setVolume(videoRef.current.volume)
          }
          break
        case "arrowdown":
          e.preventDefault()
          if (videoRef.current) {
            videoRef.current.volume = Math.max(0, volume - 0.1)
            setVolume(videoRef.current.volume)
          }
          break
        case "j":
          e.preventDefault()
          skip(-10)
          break
        case "l":
          e.preventDefault()
          skip(10)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, toggleFullscreen, toggleMute, skip, volume, isFullscreen])

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handleLoadedData = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onEnded?.()
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("progress", handleProgress)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("progress", handleProgress)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onEnded])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [])

  const progressPercent = duration ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className={`relative bg-black group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      tabIndex={0}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        autoPlay={autoPlay}
        playsInline
        preload="auto"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition">
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Seek Bar - Always Visible at Bottom (YouTube Style) */}
      <div 
        ref={progressRef}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-pointer group/progress z-50 hover:h-3 transition-all"
        onClick={handleProgressClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseMove={(e) => {
          const progress = progressRef.current
          if (!progress) return
          const rect = progress.getBoundingClientRect()
          const pos = (e.clientX - rect.left) / rect.width
          const hoverTime = pos * duration
          // Could show tooltip here if needed
        }}
      >
        <div className="relative h-full w-full bg-white/20">
          {/* Buffered */}
          <div 
            className="absolute h-full bg-white/40"
            style={{ width: `${bufferedPercent}%` }}
          />
          {/* Progress */}
          <div 
            className="absolute h-full bg-red-600"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Thumb - Always visible, larger on hover */}
          <div 
            className="absolute w-4 h-4 bg-red-600 rounded-full -top-1 transition-all group-hover/progress:w-5 group-hover/progress:h-5 group-hover/progress:-top-1.5 shadow-lg border-2 border-white"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>
      </div>

      {/* Controls Overlay - Positioned above seek bar */}
      <div 
        className={`absolute bottom-2 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 pb-4">
          {/* Play/Pause */}
          <button 
            onClick={togglePlay}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white" fill="white" />
            )}
          </button>

          {/* Skip Back */}
          <button 
            onClick={() => skip(-10)}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>

          {/* Skip Forward */}
          <button 
            onClick={() => skip(10)}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/volume">
            <button 
              onClick={toggleMute}
              className="p-2 hover:bg-white/10 rounded-full transition"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-red-600 cursor-pointer"
            />
          </div>

          {/* Time */}
          <div className="text-white text-sm ml-2">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/60"> / </span>
            <span className="text-white/60">{formatTime(duration)}</span>
          </div>

          {/* Title */}
          {title && (
            <div className="flex-1 text-white text-sm truncate ml-4">
              {title}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Fullscreen */}
          <button 
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-full transition"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-white" />
            ) : (
              <Maximize className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

