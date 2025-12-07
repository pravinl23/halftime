"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Movie {
  id: string
  title: string
  thumbnailUrl: string
  match: number
  duration: string
  genre: string[]
}

interface MovieRowProps {
  title: string
  movies: Movie[]
}

export function MovieRow({ title, movies }: MovieRowProps) {
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
    <div className="space-y-2 md:space-y-4 mb-8 px-4 md:px-12 group">
      <h2 className="w-56 cursor-pointer text-sm font-semibold text-[#e5e5e5] transition duration-200 hover:text-white md:text-2xl">
        {title}
      </h2>
      
      <div className="relative group/row">
        <ChevronLeft
          className={cn(
            "absolute top-0 bottom-0 left-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover/row:opacity-100 bg-black/50 rounded-full p-1",
            !isMoved && "hidden"
          )}
          onClick={() => handleClick("left")}
        />

        <div
          ref={rowRef}
          className="flex items-center space-x-2 overflow-x-scroll scrollbar-hide md:space-x-4 overflow-y-hidden pb-8 pt-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="relative h-28 min-w-[180px] cursor-pointer transition duration-200 ease-out md:h-36 md:min-w-[260px] hover:scale-105 hover:z-50"
            >
              <img
                src={movie.thumbnailUrl}
                className="rounded-sm object-cover md:rounded w-full h-full"
                alt={movie.title}
              />
              
              {/* Hover Card (Simple version for now) */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors rounded-sm md:rounded flex items-center justify-center opacity-0 hover:opacity-100">
                <div className="flex gap-2">
                  <div className="bg-white rounded-full p-2 hover:bg-white/90 transition">
                    <Play className="w-4 h-4 text-black fill-black" />
                  </div>
                  <div className="border-2 border-gray-300 rounded-full p-2 hover:border-white transition">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <div className="border-2 border-gray-300 rounded-full p-2 hover:border-white transition">
                    <ThumbsUp className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ChevronRight
          className="absolute top-0 bottom-0 right-2 z-40 m-auto h-9 w-9 cursor-pointer opacity-0 transition hover:scale-125 group-hover/row:opacity-100 bg-black/50 rounded-full p-1"
          onClick={() => handleClick("right")}
        />
      </div>
    </div>
  )
}

