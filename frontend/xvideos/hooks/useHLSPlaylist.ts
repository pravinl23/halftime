"use client"

import { useEffect, useRef, useState } from "react"

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

interface PlaylistStatus {
  status: "queued" | "processing" | "completed" | "failed"
  progress: number
  playlist_url: string
  error?: string
}

export function useHLSPlaylist(
  jobId: string | null,
  accessToken: string | null,
  pollInterval: number = 5000
) {
  const [status, setStatus] = useState<PlaylistStatus | null>(null)
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null)
  const [hasUpdated, setHasUpdated] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastPlaylistUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!jobId || !accessToken) return

    const pollStatus = async () => {
      try {
        const response = await fetch(
          `${BACKEND_API_URL}/api/v1/videos/status/${jobId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`
            }
          }
        )

        if (!response.ok) {
          console.error("Failed to fetch status:", response.status)
          return
        }

        const data: PlaylistStatus = await response.json()
        setStatus(data)

        // Update playlist URL if it changed
        if (data.playlist_url) {
          const fullPlaylistUrl = `${BACKEND_API_URL}${data.playlist_url}`
          
          // Check if playlist has been updated (new segments ready)
          if (lastPlaylistUrlRef.current !== fullPlaylistUrl) {
            if (lastPlaylistUrlRef.current !== null) {
              // Playlist was updated
              setHasUpdated(true)
            }
            lastPlaylistUrlRef.current = fullPlaylistUrl
            setPlaylistUrl(fullPlaylistUrl)
          }
        }

        // Stop polling if completed or failed
        if (data.status === "completed" || data.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
          }
        }
      } catch (error) {
        console.error("Error polling playlist status:", error)
      }
    }

    // Poll immediately
    pollStatus()

    // Set up polling interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(pollStatus, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId, accessToken, pollInterval])

  return {
    status,
    playlistUrl,
    hasUpdated,
    isProcessing: status?.status === "processing" || status?.status === "queued",
    isCompleted: status?.status === "completed",
    isFailed: status?.status === "failed",
    progress: status?.progress || 0
  }
}

