"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Search, Tv, ChevronDown } from "lucide-react"

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
  const [excludedShows, setExcludedShows] = useState<typeof POPULAR_SHOWS>([])
  const [excludedKeywords, setExcludedKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredShows = POPULAR_SHOWS.filter(show =>
    show.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
    show.genre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleShow = (show: typeof POPULAR_SHOWS[0]) => {
    if (excludedShows.some(s => s.id === show.id)) {
      setExcludedShows(excludedShows.filter(s => s.id !== show.id))
    } else {
      setExcludedShows([...excludedShows, show])
    }
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !excludedKeywords.includes(keywordInput.trim())) {
      setExcludedKeywords([...excludedKeywords, keywordInput.trim()])
      setKeywordInput("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setExcludedKeywords(excludedKeywords.filter(k => k !== keyword))
  }

  const handleSubmit = async () => {
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

      // Save content exclusions
      const response = await fetch(`${apiUrl}/api/v1/onboarding/content-preferences`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          excluded_shows: excludedShows.map(s => ({
            id: s.id,
            name: s.name,
            network: s.network,
            genre: s.genre
          })),
          excluded_keywords: excludedKeywords,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save content preferences")
      }

      toast.success("Onboarding complete!")
      router.push("/")
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error(error.message || "Failed to complete onboarding")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="glass-card p-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-white text-[28px] font-bold tracking-tight">Exclude Content</h1>
          <p className="text-white/60 text-[15px]">
            Select shows where you DON'T want your ads to appear
          </p>
        </div>

        {/* Shows Dropdown */}
        <div className="space-y-3 relative" ref={dropdownRef}>
          <Label className="text-white text-[14px] font-medium">Exclude Shows (Optional)</Label>
          <p className="text-white/60 text-sm">Select shows to exclude from ad placements</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isLoading}
              className="w-full h-12 px-4 bg-neutral-800 border border-white/20 text-white text-left flex items-center justify-between hover:bg-neutral-700 transition-all"
            >
              <span className={excludedShows.length === 0 ? "text-white/40" : ""}>
                {excludedShows.length === 0 ? "Select shows to exclude..." : `${excludedShows.length} shows excluded`}
              </span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
            {showDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-neutral-800 border border-white/30  overflow-hidden max-h-64 overflow-y-auto">
                {filteredShows.map((show) => (
                  <div
                    key={show.id}
                    onClick={() => handleToggleShow(show)}
                    className="px-4 py-3 cursor-pointer hover:bg-neutral-700 transition-colors flex items-center gap-3 border-b border-white/10 last:border-b-0"
                  >
                    <div className={`w-4 h-4 rounded border ${excludedShows.some(s => s.id === show.id) ? 'bg-white border-white' : 'border-white/40'}`} />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{show.name}</p>
                      <p className="text-white/70 text-xs">{show.network} • {show.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Excluded Shows */}
        {excludedShows.length > 0 && (
          <div className="space-y-3">
            <Label className="text-white text-[14px] font-medium">
              Excluded Shows ({excludedShows.length})
            </Label>
            <div className="flex flex-wrap gap-2">
              {excludedShows.map((show) => (
                <Badge key={show.id} className="bg-red-500/20 text-red-300 border-red-500/40 pl-3 pr-2 py-2">
                  <Tv className="h-3 w-3 mr-2" />
                  {show.name}
                  <button
                    onClick={() => handleToggleShow(show)}
                    className="ml-2 hover:text-red-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}


        {/* Keyword Exclusions */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="keywords" className="text-white text-[14px] font-medium">
              Keyword Exclusions (Optional)
            </Label>
            <p className="text-white/60 text-sm mt-1">
              Add keywords to exclude content (e.g., violence, explicit, horror)
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              id="keywords"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddKeyword()
                }
              }}
              placeholder="e.g., violence, explicit, horror..."
              className="h-11 bg-neutral-800 border-white/20 text-white placeholder:text-white/50  text-base px-4 focus:bg-neutral-700 focus:border-white/30"
            />
            <Button
              type="button"
              onClick={handleAddKeyword}
              disabled={!keywordInput.trim()}
              className="h-11  bg-neutral-800 border border-white/20 text-white font-medium hover:bg-neutral-700 px-6"
            >
              Add
            </Button>
          </div>
          {excludedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {excludedKeywords.map((keyword, index) => (
                <Badge key={index} className="bg-red-500/20 text-red-300 border-red-500/40 pl-3 pr-2 py-2">
                  {keyword}
                  <button
                    onClick={() => handleRemoveKeyword(keyword)}
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
          disabled={isLoading}
          className="w-full h-12  bg-white text-black font-medium text-[16px] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
        >
          {isLoading ? "Saving..." : "Complete Onboarding"}
        </Button>
      </div>
    </div>
  )
}
