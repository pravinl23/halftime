"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Bell, Menu, X as CloseIcon, LogOut, User as UserIcon, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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
            <button
              onClick={() => console.log("Search clicked")}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-white hover:text-gray-300 transition-colors" />
            </button>
            <button
              onClick={() => console.log("Notifications clicked")}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-white hover:text-gray-300 transition-colors" />
            </button>
            
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
