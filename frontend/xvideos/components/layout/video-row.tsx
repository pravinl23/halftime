"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Video } from "@/lib/mock-data"

interface VideoRowProps {
  title: string
  videos: Video[]
}

export function VideoRow({ title, videos }: VideoRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [isMoved, setIsMoved] = useState(false)

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
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="relative w-[180px] md:w-[240px] shrink-0 cursor-pointer transition duration-200 ease-out hover:scale-105 hover:z-50 group/item active:scale-95 shadow-md hover:shadow-xl"
            >
              <div className="relative aspect-[2/3] rounded overflow-hidden bg-gray-900 group-hover/item:border-2 group-hover/item:border-white transition-all">
                <img
                  src={video.thumbnailUrl}
                  className="w-full h-full object-cover"
                  alt={video.title}
                />
                
                {/* Gradient Overlay for Text Readability */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent" />
                
                {video.isNew && (
                  <div className="absolute top-2 right-2 bg-white/90 rounded-full px-2 py-0.5 text-xs font-semibold text-black z-10">
                    New
                  </div>
                )}
                
                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-4 z-10">
                  {video.studio && (
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1 opacity-90 text-shadow">{video.studio}</p>
                  )}
                  {/* Title centered if short or multiline */}
                  <h3 className="text-lg font-bold text-white leading-tight mb-2 text-shadow-lg uppercase text-center md:text-left drop-shadow-md">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-gray-200 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                    {video.rating && <span className="border border-gray-400 px-1 rounded bg-black/30 backdrop-blur-sm">{video.rating}</span>}
                    {video.year && <span>{video.year}</span>}
                    {video.genre && video.genre.length > 0 && (
                      <span className="truncate max-w-[100px]">• {video.genre.join(", ")}</span>
                    )}
                  </div>
                </div>
                
                {/* Hover overlay actions - moved to top right or hidden to keep clean */}
                <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/item:opacity-100 pointer-events-none">
                  {/* Icons removed to match cleaner look, or kept minimal */}
                </div>
              </div>
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

