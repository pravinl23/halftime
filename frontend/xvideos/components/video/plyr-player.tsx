"use client"

import { useRef } from "react"
import Plyr from "plyr-react"

interface PlyrPlayerProps {
  src: string
  poster?: string
  title?: string
  className?: string
}

export function PlyrPlayer({ src, poster, title, className = "" }: PlyrPlayerProps) {
  const playerRef = useRef<any>(null)

  const videoOptions = {
    controls: [
      "play-large",
      "restart",
      "rewind",
      "play",
      "fast-forward",
      "progress",
      "current-time",
      "duration",
      "mute",
      "volume",
      "settings",
      "pip",
      "airplay",
      "fullscreen"
    ],
    settings: ["captions", "quality", "speed"],
    keyboard: {
      focused: true,
      global: false
    },
    tooltips: {
      controls: true,
      seek: true
    },
    clickToPlay: true,
    hideControls: true,
    resetOnEnd: false
  }

  return (
    <div className={`relative ${className}`}>
      <Plyr
        ref={playerRef}
        source={{
          type: "video",
          sources: [
            {
              src: src,
              type: "video/mp4"
            }
          ],
          poster: poster
        }}
        options={videoOptions}
      />
    </div>
  )
}

