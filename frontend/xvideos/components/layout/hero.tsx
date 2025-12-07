import Image from "next/link"
import { Play, Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroProps {
  title: string
  description: string
  imageUrl: string
  videoUrl?: string
}

export function Hero({ title, description, imageUrl }: HeroProps) {
  return (
    <div className="relative h-[56.25vw] w-full max-h-[85vh] min-h-[600px]">
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute top-[30%] left-4 md:left-12 w-full md:w-[40%] space-y-4 z-10">
        <h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">
          {title}
        </h1>
        <p className="text-base md:text-lg text-gray-200 drop-shadow-md line-clamp-3">
          {description}
        </p>
        
        <div className="flex items-center gap-3 pt-4">
          <Button size="lg" className="bg-white text-black hover:bg-white/90 gap-2 font-bold text-lg px-8">
            <Play className="w-6 h-6 fill-black" /> Play
          </Button>
          <Button size="lg" variant="secondary" className="bg-gray-500/70 text-white hover:bg-gray-500/50 gap-2 font-bold text-lg px-8">
            <Info className="w-6 h-6" /> More Info
          </Button>
        </div>
      </div>
    </div>
  )
}

