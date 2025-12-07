"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function WatchPage() {
  const params = useParams()
  
  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Navigation overlay */}
      <div className="absolute top-0 left-0 w-full z-50 p-4 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 hover:opacity-100 opacity-0">
        <Link href="/" className="text-white hover:text-gray-300 transition">
          <ArrowLeft className="w-8 h-8" />
        </Link>
        <h1 className="text-xl font-medium text-white">
          Watching Video {params.id}
        </h1>
      </div>

      {/* Video Player */}
      <div className="flex-1 relative flex items-center justify-center">
        <video
          className="w-full h-full object-contain"
          autoPlay
          controls
          controlsList="nodownload"
          poster="https://images.hdqwalls.com/wallpapers/south-park-4k-artwork-y5.jpg"
        >
          <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}
