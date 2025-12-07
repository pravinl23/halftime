"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Search, Tv } from "lucide-react"

const POPULAR_SHOWS = [
  { id: 1, name: "Breaking Bad", network: "AMC", genre: "Drama" },
  { id: 2, name: "The Office", network: "NBC", genre: "Comedy" },
  { id: 3, name: "Stranger Things", network: "Netflix", genre: "Sci-Fi" },
  { id: 4, name: "Game of Thrones", network: "HBO", genre: "Fantasy" },
  { id: 5, name: "Friends", network: "NBC", genre: "Comedy" },
  { id: 6, name: "The Crown", network: "Netflix", genre: "Drama" },
  { id: 7, name: "South Park", network: "Comedy Central", genre: "Animation" },
  { id: 8, name: "The Simpsons", network: "FOX", genre: "Animation" },
  { id: 9, name: "Succession", network: "HBO", genre: "Drama" },
  { id: 10, name: "The Mandalorian", network: "Disney+", genre: "Sci-Fi" },
  { id: 11, name: "Planet Earth", network: "BBC", genre: "Documentary" },
  { id: 12, name: "The Last of Us", network: "HBO", genre: "Drama" },
]

export default function ContentSelectionPage() {
  const router = useRouter()
  const [selectedShows, setSelectedShows] = useState<typeof POPULAR_SHOWS>([])
  const [restrictions, setRestrictions] = useState<string[]>([])
  const [restrictionInput, setRestrictionInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const filteredShows = POPULAR_SHOWS.filter(show =>
    show.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.genre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleShow = (show: typeof POPULAR_SHOWS[0]) => {
    if (selectedShows.some(s => s.id === show.id)) {
      setSelectedShows(selectedShows.filter(s => s.id !== show.id))
    } else {
      setSelectedShows([...selectedShows, show])
    }
  }

  const handleAddRestriction = () => {
    if (restrictionInput.trim() && !restrictions.includes(restrictionInput.trim())) {
      setRestrictions([...restrictions, restrictionInput.trim()])
      setRestrictionInput("")
    }
  }

  const handleRemoveRestriction = (restriction: string) => {
    setRestrictions(restrictions.filter(r => r !== restriction))
  }

  const handleSubmit = async () => {
    if (selectedShows.length === 0) {
      toast.error("Please select at least one show")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Not authenticated")
        router.push("/login")
        return
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
      const { data: { session } } = await supabase.auth.getSession()

      // Save content preferences
      const response = await fetch(`${apiUrl}/api/v1/onboarding/content-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          selected_shows: selectedShows.map(s => ({
            id: s.id,
            name: s.name,
            network: s.network,
            genre: s.genre
          })),
          content_restrictions: restrictions,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save content preferences")
      }

      toast.success("Onboarding complete!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error(error.message || "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-white text-[32px] font-bold">Choose Content</h1>
        <p className="text-white/60 text-[16px]">
          Select shows where you'd like your ads to appear
        </p>
      </div>

      {/* Search */}
      <div className="space-y-3">
        <Label className="text-white text-[15px] font-medium">Search Shows</Label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, network, or genre..."
            className="h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base backdrop-blur-md focus:bg-white/10 focus:border-white/20"
          />
        </div>
      </div>

      {/* Selected Shows */}
      {selectedShows.length > 0 && (
        <div className="space-y-3">
          <Label className="text-white text-[15px] font-medium">
            Selected Shows ({selectedShows.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {selectedShows.map((show) => (
              <Badge key={show.id} className="bg-[#1d9bf0] text-white border-[#1d9bf0] pl-3 pr-2 py-2">
                <Tv className="h-3 w-3 mr-2" />
                {show.name}
                <button
                  onClick={() => handleToggleShow(show)}
                  className="ml-2 hover:text-red-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Show Grid */}
      <div className="space-y-3">
        <Label className="text-white text-[15px] font-medium">Popular Shows</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
          {filteredShows.map((show) => (
            <div
              key={show.id}
              onClick={() => handleToggleShow(show)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedShows.some(s => s.id === show.id)
                  ? "bg-[#1d9bf0]/20 border-[#1d9bf0]"
                  : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-[15px]">{show.name}</h3>
                  <p className="text-white/60 text-sm mt-1">{show.network}</p>
                </div>
                <Badge className="bg-white/10 text-white border-white/20 text-xs">
                  {show.genre}
                </Badge>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <div className={`w-5 h-5 rounded border ${
                  selectedShows.some(s => s.id === show.id)
                    ? "bg-[#1d9bf0] border-[#1d9bf0]"
                    : "border-white/40"
                }`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Restrictions */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="restrictions" className="text-white text-[15px] font-medium">
            Content Restrictions (Optional)
          </Label>
          <p className="text-white/60 text-sm mt-1">
            Specify shows or content where you DON'T want your ads
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            id="restrictions"
            value={restrictionInput}
            onChange={(e) => setRestrictionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddRestriction()
              }
            }}
            placeholder="e.g., violent shows, explicit content..."
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20"
          />
          <Button
            type="button"
            onClick={handleAddRestriction}
            disabled={!restrictionInput.trim()}
            className="h-12 rounded-xl bg-white text-black font-bold hover:bg-white/90 px-6"
          >
            Add
          </Button>
        </div>
        {restrictions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {restrictions.map((restriction, index) => (
              <Badge key={index} className="bg-red-500/20 text-red-300 border-red-500/40 pl-3 pr-2 py-2">
                {restriction}
                <button
                  onClick={() => handleRemoveRestriction(restriction)}
                  className="ml-2 hover:text-red-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={selectedShows.length === 0 || isLoading}
        className="w-full h-14 rounded-full bg-[#1d9bf0] text-white font-bold text-[17px] hover:bg-[#1a8cd8] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
      >
        {isLoading ? "Saving..." : "Complete Onboarding"}
      </Button>
    </div>
  )
}
