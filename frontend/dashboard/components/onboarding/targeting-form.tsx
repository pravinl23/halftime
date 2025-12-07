"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown } from "lucide-react"

const AGE_RANGES = [
  { label: "13-17", value: { min: 13, max: 17 } },
  { label: "18-24", value: { min: 18, max: 24 } },
  { label: "25-34", value: { min: 25, max: 34 } },
  { label: "35-44", value: { min: 35, max: 44 } },
  { label: "45-54", value: { min: 45, max: 54 } },
  { label: "55+", value: { min: 55, max: 100 } },
]

const GENDERS = ["Male", "Female", "Non-binary", "All"]

const CONTENT_GENRES = [
  "Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance",
  "Documentary", "Thriller", "Animation", "Fantasy", "Crime",
  "Sports", "Reality TV", "News", "Kids & Family"
]

interface TargetingFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
}

export function TargetingForm({ onSubmit, isLoading }: TargetingFormProps) {
  const [ageRanges, setAgeRanges] = useState<any[]>([])
  const [genders, setGenders] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [interestInput, setInterestInput] = useState("")
  const [location, setLocation] = useState("")
  const [contentGenres, setContentGenres] = useState<string[]>([])
  
  const [showAgeDropdown, setShowAgeDropdown] = useState(false)
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)

  const ageDropdownRef = useRef<HTMLDivElement>(null)
  const genderDropdownRef = useRef<HTMLDivElement>(null)
  const genreDropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ageDropdownRef.current && !ageDropdownRef.current.contains(event.target as Node)) {
        setShowAgeDropdown(false)
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setShowGenderDropdown(false)
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setShowGenreDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleAgeRangeToggle = (range: any) => {
    if (ageRanges.some(r => r.min === range.min && r.max === range.max)) {
      setAgeRanges(ageRanges.filter(r => !(r.min === range.min && r.max === range.max)))
    } else {
      setAgeRanges([...ageRanges, range])
    }
  }

  const handleGenderToggle = (gender: string) => {
    if (gender === "All") {
      if (genders.includes("All")) {
        setGenders([])
      } else {
        setGenders(["All"])
      }
    } else {
      const newGenders = genders.filter(g => g !== "All")
      if (newGenders.includes(gender)) {
        setGenders(newGenders.filter(g => g !== gender))
      } else {
        setGenders([...newGenders, gender])
      }
    }
  }

  const handleGenreToggle = (genre: string) => {
    if (contentGenres.includes(genre)) {
      setContentGenres(contentGenres.filter(g => g !== genre))
    } else {
      setContentGenres([...contentGenres, genre])
    }
  }

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()])
      setInterestInput("")
    }
  }

  const handleRemoveInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      age_ranges: ageRanges,
      genders,
      interests,
      location: location || undefined,
      content_genres: contentGenres,
    })
  }

  const isValid = ageRanges.length > 0 && genders.length > 0 && contentGenres.length > 0

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Audience Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Age Ranges Dropdown */}
        <div className="space-y-2 relative" ref={ageDropdownRef}>
          <Label className="text-white text-[15px] font-medium">Target Age Ranges *</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAgeDropdown(!showAgeDropdown)}
              disabled={isLoading}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-left flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <span className={ageRanges.length === 0 ? "text-white/40" : ""}>
                {ageRanges.length === 0 
                  ? "Select age ranges..." 
                  : ageRanges.map(r => AGE_RANGES.find(ar => ar.value.min === r.min && ar.value.max === r.max)?.label).join(", ")
                }
              </span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
            {showAgeDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-[#16181c] border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                {AGE_RANGES.map((range) => (
                  <div
                    key={range.label}
                    onClick={() => handleAgeRangeToggle(range.value)}
                    className="px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <div className={`w-4 h-4 rounded border ${ageRanges.some(r => r.min === range.value.min && r.max === range.value.max) ? 'bg-[#1d9bf0] border-[#1d9bf0]' : 'border-white/40'}`} />
                    <span className="text-white text-sm">{range.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gender Dropdown */}
        <div className="space-y-2 relative" ref={genderDropdownRef}>
          <Label className="text-white text-[15px] font-medium">Target Genders *</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGenderDropdown(!showGenderDropdown)}
              disabled={isLoading}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-left flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <span className={genders.length === 0 ? "text-white/40" : ""}>
                {genders.length === 0 ? "Select genders..." : genders.join(", ")}
              </span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
            {showGenderDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-[#16181c] border border-white/20 rounded-xl overflow-hidden shadow-2xl">
                {GENDERS.map((gender) => (
                  <div
                    key={gender}
                    onClick={() => handleGenderToggle(gender)}
                    className="px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <div className={`w-4 h-4 rounded border ${genders.includes(gender) ? 'bg-[#1d9bf0] border-[#1d9bf0]' : 'border-white/40'}`} />
                    <span className="text-white text-sm">{gender}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Location & Genres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-white text-[15px] font-medium">Location (Optional)</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., United States, New York, California..."
            disabled={isLoading}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
        </div>

        {/* Content Genres */}
        <div className="space-y-2 relative" ref={genreDropdownRef}>
          <Label className="text-white text-[15px] font-medium">Content Genres *</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowGenreDropdown(!showGenreDropdown)}
              disabled={isLoading}
              className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-left flex items-center justify-between hover:bg-white/10 transition-all"
            >
              <span className={contentGenres.length === 0 ? "text-white/40" : ""}>
                {contentGenres.length === 0 ? "Select genres..." : `${contentGenres.length} genres selected`}
              </span>
              <ChevronDown className="h-4 w-4 text-white/60" />
            </button>
            {showGenreDropdown && (
              <div className="absolute z-50 w-full mt-2 bg-[#16181c] border border-white/20 rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
                {CONTENT_GENRES.map((genre) => (
                  <div
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className="px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <div className={`w-4 h-4 rounded border ${contentGenres.includes(genre) ? 'bg-[#1d9bf0] border-[#1d9bf0]' : 'border-white/40'}`} />
                    <span className="text-white text-sm">{genre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {contentGenres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {contentGenres.map((genre) => (
                <Badge key={genre} className="bg-white/10 text-white border-white/20 pl-3 pr-2 py-1">
                  {genre}
                  <button
                    type="button"
                    onClick={() => handleGenreToggle(genre)}
                    className="ml-2 hover:text-red-400"
                    disabled={isLoading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Interests */}
      <div className="space-y-3">
        <Label htmlFor="interests" className="text-white text-[15px] font-medium">Interests & Keywords (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="interests"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddInterest()
              }
            }}
            placeholder="e.g., sneakers, basketball, fitness..."
            disabled={isLoading}
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl text-base px-4 backdrop-blur-md focus:bg-white/10 focus:border-white/20 transition-all"
          />
          <Button
            type="button"
            onClick={handleAddInterest}
            disabled={!interestInput.trim() || isLoading}
            className="h-12 rounded-xl bg-white text-black font-bold hover:bg-white/90 px-6"
          >
            Add
          </Button>
        </div>
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {interests.map((interest, index) => (
              <Badge key={index} className="bg-white/10 text-white border-white/20 pl-3 pr-2 py-1">
                {interest}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-2 hover:text-red-400"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-full bg-[#1d9bf0] text-white font-bold text-[16px] hover:bg-[#1a8cd8] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
        disabled={!isValid || isLoading}
      >
        {isLoading ? "Saving..." : "Continue"}
      </Button>
    </form>
  )
}
