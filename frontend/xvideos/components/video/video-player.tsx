"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward
} from "lucide-react"
import type { Ad } from "@/lib/videos"

interface VideoPlayerProps {
  src: string
  poster?: string
  ad?: Ad
  expectedDuration?: number // Fallback duration in seconds when video metadata not yet loaded
  onAdStart?: () => void
  onAdEnd?: () => void
  className?: string
}

export function VideoPlayer({
  src,
  poster,
  ad,
  expectedDuration,
  onAdStart,
  onAdEnd,
  className = ""
}: VideoPlayerProps) {
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
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [isInAd, setIsInAd] = useState(false)

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

  // Check if a time is within the ad segment
  const isTimeInAd = useCallback((time: number): boolean => {
    if (!ad) return false
    return time >= ad.startTime && time <= ad.endTime
  }, [ad])

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

  // Effective duration for calculations (fallback to expected duration)
  const effectiveDuration = useMemo(() => {
    return duration > 0 ? duration : (expectedDuration || 0)
  }, [duration, expectedDuration])

  // Skip forward/backward
  const skip = useCallback((seconds: number) => {
    const video = videoRef.current
    if (!video) return
    const maxTime = effectiveDuration || video.duration || Infinity
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, maxTime))
  }, [effectiveDuration])

  // Handle progress bar click - click anywhere to seek
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progress = progressRef.current
    const video = videoRef.current
    if (!progress || !video || effectiveDuration === 0) return
    const rect = progress.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = Math.max(0, Math.min(pos * effectiveDuration, effectiveDuration))
  }, [effectiveDuration])

  // Handle progress bar hover
  const handleProgressHover = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progress = progressRef.current
    if (!progress || effectiveDuration === 0) return
    const rect = progress.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    setHoverTime(pos * effectiveDuration)
    setHoverPosition(e.clientX - rect.left)
  }, [effectiveDuration])

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
        case "j":
          e.preventDefault()
          skip(-10)
          break
        case "arrowright":
        case "l":
          e.preventDefault()
          skip(10)
          break
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, toggleFullscreen, toggleMute, skip, isFullscreen])

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
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const inAd = isTimeInAd(video.currentTime)
      if (inAd && !isInAd) {
        setIsInAd(true)
        onAdStart?.()
      } else if (!inAd && isInAd) {
        setIsInAd(false)
        onAdEnd?.()
      }
    }
    const handleDurationChange = () => setDuration(video.duration)
    const handleLoadedData = () => setIsLoading(false)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("progress", handleProgress)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("durationchange", handleDurationChange)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("progress", handleProgress)
    }
  }, [isTimeInAd, isInAd, onAdStart, onAdEnd])

  // Cleanup
  useEffect(() => {
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current)
      }
    }
  }, [])

  const progressPercent = effectiveDuration ? (currentTime / effectiveDuration) * 100 : 0
  const bufferedPercent = effectiveDuration ? (buffered / effectiveDuration) * 100 : 0
  
  // Calculate ad marker position on progress bar
  const adStartPercent = ad && effectiveDuration ? (ad.startTime / effectiveDuration) * 100 : 0
  const adEndPercent = ad && effectiveDuration ? (ad.endTime / effectiveDuration) * 100 : 0
  // Ensure minimum visible width of 2% for very short ads (makes them clearly visible)
  const adWidthPercent = Math.max(2, adEndPercent - adStartPercent)
  
  // Debug: Log ad marker info (remove in production)
  useEffect(() => {
    if (ad && effectiveDuration > 0) {
      const shouldShow = adStartPercent >= 0 && adWidthPercent > 0
      console.log('Ad marker:', {
        startTime: ad.startTime,
        endTime: ad.endTime,
        duration: effectiveDuration,
        startPercent: adStartPercent,
        endPercent: adEndPercent,
        widthPercent: adWidthPercent,
        shouldShow,
        hasAd: !!ad,
        effectiveDurationValue: effectiveDuration
      })
    }
  }, [ad, effectiveDuration, adStartPercent, adEndPercent, adWidthPercent])

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
        autoPlay
        playsInline
        preload="auto"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {!isPlaying && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition">
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-30 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress Bar with Ad Marker - YouTube-style click anywhere */}
        <div 
          ref={progressRef}
          className="relative px-4 pt-4 pb-4 cursor-pointer group/progress"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
          style={{ overflow: 'visible' }}
        >
          {/* Invisible expanded click area for easier seeking */}
          <div className="absolute inset-x-4 top-0 bottom-0" />
          
          {/* Visible progress bar - gray background line */}
          <div 
            className="relative rounded-full group-hover/progress:h-2.5 transition-all" 
            style={{ 
              overflow: 'visible', 
              position: 'relative',
              height: '8px',
              backgroundColor: '#6B7280', // Solid gray background (gray-500 equivalent)
              width: '100%'
            }}
          >
            {/* Buffered */}
            <div 
              className="absolute h-full rounded-full transition-all z-0"
              style={{ 
                width: `${bufferedPercent}%`,
                backgroundColor: '#9CA3AF' // Solid gray for buffered (gray-400 equivalent)
              }}
            />
            
            {/* Ad Marker (Yellow like YouTube) - solid yellow segment on the gray line, clickable */}
            {ad && effectiveDuration > 0 && adStartPercent >= 0 && adWidthPercent > 0 && (
              <div 
                className="absolute h-full rounded-full z-20 cursor-pointer hover:opacity-80 transition-opacity"
                style={{ 
                  left: `${Math.max(0, Math.min(100, adStartPercent))}%`, 
                  width: `${Math.max(2, Math.min(100, adWidthPercent))}%`,
                  backgroundColor: '#FFD700', // Solid bright yellow
                  minWidth: '4px'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (ad.ctaUrl) {
                    window.open(ad.ctaUrl, '_blank')
                  }
                }}
                title={`Ad: ${formatTime(ad.startTime)} - ${formatTime(ad.endTime)} (Click to learn more)`}
              />
            )}
            
            {/* Progress (gray) - rendered after ad so progress shows on top when playing */}
            <div 
              className="absolute h-full rounded-full transition-all z-10"
              style={{ 
                width: `${progressPercent}%`,
                backgroundColor: '#D1D5DB' // Solid lighter gray for progress (gray-300 equivalent)
              }}
            />
            
            {/* Scrubber/Thumb - shows on hover, indicates current position */}
            <div 
              className="absolute w-3 h-3 bg-red-600 rounded-full -translate-y-1/4 scale-0 group-hover/progress:scale-100 transition-transform z-20 pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 6px)`, top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          {/* Hover Tooltip showing time preview */}
          {hoverTime !== null && (
            <div 
              className="absolute -top-8 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap z-30"
              style={{ left: `calc(${hoverPosition}px + 16px)` }}
            >
              {formatTime(hoverTime)}
              {isTimeInAd(hoverTime) && (
                <span className="ml-1 text-yellow-400">(Ad)</span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 px-4 pb-4">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-full transition">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Play className="w-6 h-6 text-white" fill="white" />
            )}
          </button>

          {/* Skip Back */}
          <button onClick={() => skip(-10)} className="p-2 hover:bg-white/10 rounded-full transition">
            <SkipBack className="w-5 h-5 text-white" />
          </button>

          {/* Skip Forward */}
          <button onClick={() => skip(10)} className="p-2 hover:bg-white/10 rounded-full transition">
            <SkipForward className="w-5 h-5 text-white" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/volume">
            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full transition">
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
            <span className="text-white/60">{formatTime(effectiveDuration)}</span>
          </div>

          {/* Ad indicator */}
          {isInAd && (
            <div className="ml-2 px-2 py-1 bg-yellow-400 text-black text-xs font-medium rounded">
              Ad
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full transition">
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

