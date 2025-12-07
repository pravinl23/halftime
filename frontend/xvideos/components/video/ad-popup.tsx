"use client"

import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Ad } from "@/lib/videos"
import { trackAdClick, trackAdDismissal, type AdTrackingContext } from "@/lib/analytics"

interface AdPopupProps {
  ad: Ad
  onDismiss: () => void
  visible: boolean
  trackingContext?: AdTrackingContext
}

export function AdPopup({ ad, onDismiss, visible, trackingContext }: AdPopupProps) {
  if (!visible) return null

  const handleLearnMore = () => {
    // Track click before opening
    if (trackingContext) {
      trackAdClick(trackingContext, "popup")
    }
    window.open(ad.ctaUrl, "_blank")
  }

  const handleDismiss = () => {
    // Track dismissal
    if (trackingContext) {
      trackAdDismissal(trackingContext)
    }
    onDismiss()
  }

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '24px',
        zIndex: 9999
      }}
    >
      <div className="bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl shadow-2xl p-3">
        <div className="flex items-center gap-3">
          <Button 
            className="bg-white text-black hover:bg-zinc-200 font-medium"
            onClick={handleLearnMore}
          >
            {ad.ctaText}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <button 
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-white transition p-1 hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

