"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Company {
  name: string
  domain: string
  logo_url?: string
  brand_colors?: any
}

interface CompanySearchProps {
  onSelect: (company: Company) => void
}

export function CompanySearch({ onSelect }: CompanySearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `${apiUrl}/api/v1/onboarding/known-companies/search?query=${encodeURIComponent(searchQuery)}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      toast.error("Failed to search companies")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (value: string) => {
    setQuery(value)
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          placeholder="Search for your company (e.g., Nike, Apple, Starbucks...)"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          className="glass-card h-12 text-white placeholder:text-white/50 text-base px-4 hover:brightness-110 focus:opacity-90 transition-all border-0"
        />
        
        {results.length > 0 && (
          <div className="glass-card absolute z-[100] w-full mt-2 overflow-hidden max-h-64 overflow-y-auto border-0">
            {results.map((company, index) => (
              <div
                key={index}
                className="p-4 cursor-pointer hover:bg-neutral-700 transition-colors border-b border-white/10 last:border-b-0"
                onClick={() => {
                  onSelect(company)
                  setResults([])
                  setQuery("")
                }}
              >
                <div className="flex items-center gap-4">
                  {company.logo_url && (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-10 h-10 object-contain rounded bg-white/10 p-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  )}
                  <div>
                    <p className="font-medium text-white">{company.name}</p>
                    <p className="text-sm text-white/70">{company.domain}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {isLoading && (
        <p className="text-sm text-white/60 text-center">Searching...</p>
      )}
      
      {query.length >= 2 && !isLoading && results.length === 0 && (
        <p className="text-sm text-white/60 text-center">No companies found. Try creating a custom organization below.</p>
      )}
    </div>
  )
}
