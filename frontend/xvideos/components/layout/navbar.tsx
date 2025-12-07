"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, Bell, Menu, X as CloseIcon, LogOut, User as UserIcon, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { SearchResult } from "@/lib/omdb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          console.log('Searching for:', searchQuery)
          const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
          
          if (!response.ok) {
            console.error('Search API error:', response.status, response.statusText)
            setSearchResults([])
            setIsSearching(false)
            return
          }
          
          const data = await response.json()
          console.log('Search results:', data)
          
          if (data.Error) {
            console.error('Search API returned error:', data.Error)
          }
          
          if (data.Search && data.Search.length > 0) {
            setSearchResults(data.Search)
          } else {
            setSearchResults([])
          }
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      }, 300) // 300ms debounce
    } else {
      setSearchResults([])
      setIsSearching(false)
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        if (!searchQuery) {
          setIsSearchOpen(false)
        }
      }
    }

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isSearchOpen, searchQuery])

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Signed out successfully")
      router.push("/login")
      router.refresh()
    }
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "TV Shows", href: "/tv-shows" },
    { name: "Movies", href: "/movies" },
    { name: "My List", href: "/my-list" },
  ]

  return (
    <nav
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500",
        isScrolled ? "bg-black/90 backdrop-blur-sm" : "bg-gradient-to-b from-black/80 to-transparent"
      )}
    >
      <div className="flex items-center justify-between px-4 py-4 md:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-1 text-2xl font-bold text-white pl-4 md:pl-8">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-white r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-18jsvk2 r-16y2uox r-8kz0gk">
              <g>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
              </g>
            </svg>
            <span>Videos</span>
          </Link>
        </div>

        <div className="flex items-center gap-4 pr-4 md:pr-8">
          <div className="hidden md:flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex items-center gap-2" ref={searchContainerRef}>
              {isSearchOpen && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search movies and shows..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-64 h-9 px-4 bg-white/10 border border-white/20 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all text-sm"
                  />
                  {/* Search Results Dropdown */}
                  {searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full mt-2 w-64 max-h-96 overflow-y-auto scrollbar-hide bg-black border border-white/10 rounded-lg shadow-xl z-50">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
                      ) : (
                        <>
                          {searchResults.length > 0 ? (
                            <div className="py-1">
                              {searchResults.slice(0, 8).map((result) => (
                                <Link
                                  key={result.imdbID}
                                  href={`/watch/${result.imdbID}`}
                                  className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 transition-colors cursor-pointer"
                                  onClick={() => {
                                    setSearchQuery("")
                                    setIsSearchOpen(false)
                                    setSearchResults([])
                                  }}
                                >
                                  {result.Poster !== "N/A" && result.Poster ? (
                                    <img
                                      src={result.Poster}
                                      alt={result.Title}
                                      className="w-4 h-6 object-cover rounded"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'
                                      }}
                                    />
                                  ) : (
                                    <div className="w-4 h-6 bg-gray-700 rounded"></div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm truncate">{result.Title}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-400 text-sm">
                              {searchQuery.trim().length >= 2 ? "No results found" : "Type at least 2 characters"}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-white hover:text-gray-300 transition-colors" />
              </button>
            </div>
            
            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors outline-none"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5 text-white hover:text-gray-300 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 bg-black border border-white/10 text-white" align="end">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="p-8 text-center">
                  <p className="text-gray-400 text-sm">No new notifications</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1 hover:bg-gray-800 rounded-full transition-colors outline-none"
                  aria-label="Profile"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-800 border border-white/10">
                    <img 
                      src="https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png" 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-black border border-white/10 text-white" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-white/10 focus:bg-white/10 focus:text-white text-red-500 hover:text-red-500 focus:text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <button 
            className="md:hidden text-white p-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <CloseIcon /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-black border-t border-gray-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top-5">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-gray-300 hover:text-white text-lg font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="border-t border-gray-800 my-2 pt-2">
             <button 
                onClick={handleSignOut}
                className="w-full text-left text-red-500 hover:text-red-400 text-lg font-medium flex items-center gap-2"
             >
               <LogOut className="w-5 h-5" />
               Sign out
             </button>
          </div>
        </div>
      )}
    </nav>
  )
}
