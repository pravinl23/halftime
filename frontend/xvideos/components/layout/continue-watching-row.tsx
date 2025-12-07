"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { ContinueWatchingItem } from "@/lib/mock-data"

interface ContinueWatchingRowProps {
  title: string
  items: ContinueWatchingItem[]
}

// Helper function to track watched shows in localStorage
function trackWatchedShow(showTitle: string) {
  if (typeof window === "undefined") return
  
  try {
    const stored = localStorage.getItem("watchedShows")
    const watchedShows: string[] = stored ? JSON.parse(stored) : []
    
    // Add show if not already in the list
    if (!watchedShows.includes(showTitle)) {
      watchedShows.push(showTitle)
      // Keep only the last 50 shows
      if (watchedShows.length > 50) {
        watchedShows.shift()
      }
      localStorage.setItem("watchedShows", JSON.stringify(watchedShows))
    }
  } catch (e) {
    console.error("Error tracking watched show:", e)
  }
}

export function ContinueWatchingRow({ title, items }: ContinueWatchingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isMoved, setIsMoved] = useState(false)

  const handleShowClick = (showTitle: string) => {
    trackWatchedShow(showTitle)
  }

  const handleClick = (direction: "left" | "right") => {
    setIsMoved(true)
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth

      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-4 mb-12 px-8 md:px-16 group">
      <h2 className="text-xl md:text-2xl font-semibold text-white">
        {title}
      </h2>
      
      <div className="relative group/row">
        <ChevronLeft
          className={cn(
            "absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover/row:opacity-100 bg-black/70 rounded-full p-1 text-white",
            !isMoved && "hidden"
          )}
          onClick={() => handleClick("left")}
        />

        <div
          ref={rowRef}
          className="flex items-start space-x-4 overflow-x-scroll scrollbar-hide overflow-y-hidden pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/watch/${item.id}`}
              onClick={() => handleShowClick(item.title)}
              className="relative w-[280px] md:w-[320px] shrink-0 cursor-pointer transition duration-200 ease-out hover:scale-105 hover:z-50 group/item active:scale-95 shadow-md hover:shadow-xl"
            >
              <div className="relative aspect-video rounded overflow-hidden bg-gray-900 group-hover/item:border-2 group-hover/item:border-white transition-all">
                <img
                  src={item.thumbnailUrl}
                  className="w-full h-full object-cover opacity-80 group-hover/item:opacity-100 transition-opacity"
                  alt={item.title}
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/50 to-transparent" />
                
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700 z-20">
                  <div 
                    className="h-full bg-[#1d9bf0]"
                    style={{ width: "85%" }}
                  />
                </div>

                {/* Info Overlay */}
                <div className="absolute bottom-3 left-0 w-full p-4 z-10">
                  <h3 className="text-lg font-bold text-white mb-1 drop-shadow-md">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-300 font-medium mb-1 opacity-90">
                    {item.timeRemaining}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity">
                    <span className="border border-gray-500 px-1 rounded bg-black/40">{item.rating}</span>
                    {item.episode && <span>• {item.episode}</span>}
                  </div>
                </div>
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-20 pointer-events-none">
                   <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 border border-white/50">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                </div>
              </div>
              
              {/* Removed external text block */}
            </Link>
          ))}
        </div>

        <ChevronRight
          className="absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover/row:opacity-100 bg-black/70 rounded-full p-1 text-white"
          onClick={() => handleClick("right")}
        />
      </div>
    </div>
  )
}

