"use client"

import { X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Ad } from "@/lib/videos"

interface AdPopupProps {
  ad: Ad
  onDismiss: () => void
  visible: boolean
}

export function AdPopup({ ad, onDismiss, visible }: AdPopupProps) {
  if (!visible) return null

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
            onClick={() => window.open(ad.ctaUrl, "_blank")}
          >
            {ad.ctaText}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <button 
            onClick={onDismiss}
            className="text-zinc-500 hover:text-white transition p-1 hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

